
import { exec } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

const PYTHON_SCRIPT = join(__dirname, 'extract_colors.py');
const REAL_SITES_PATH = join(__dirname, '../src/data/realSites.ts');
const TEMP_OUTPUT_JSON = join(__dirname, 'temp_colors.json');

// Helper to reliably parse the potentially huge JS object from TS file
async function parseRealSites(filePath) {
    const content = await readFile(filePath, 'utf8');

    // Find the array start and end
    const startMarker = 'export const realSites: WebsiteData[] = [';
    const endMarker = '];';

    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) throw new Error('Could not find start of realSites array');

    const arrayStartIndex = startIndex + startMarker.length - 1; // Include the [
    const lastIndex = content.lastIndexOf(endMarker);
    if (lastIndex === -1) throw new Error('Could not find end of realSites array');

    const arrayContent = content.substring(arrayStartIndex, lastIndex + 1);

    // The content inside might contain trailing commas which JSON.parse hates.
    // Also it might have comments.
    // Cleaning it up for JSON.parse
    // 1. Remove comments if any (though structured data usually doesn't have them here)
    // 2. Fix trailing commas (e.g. , ] -> ])
    // 3. Ensure keys are quoted (they seem to be)

    try {
        // Evaluate it safely? No, better to generic JSON parse if possible.
        // Let's assume it's valid JSON-like structure (keys quoted, strings quoted)
        // We might need to permit trailing commas.
        return {
            prefix: content.substring(0, arrayStartIndex),
            data: JSON.parse(arrayContent), // This might fail if strict JSON is not met
            suffix: content.substring(lastIndex + 1)
        };
    } catch (e) {
        console.warn("Direct JSON parse failed, trying relaxed parsing or manual fix...");
        // If simple parse fails, we might need a more robust parser or just use eval (unsafe but practical for dev tool)
        // Since this is a dev script running locally, eval is acceptable risk if we trust the source file.
        // We need to mock 'WebsiteData' type or just strip it.

        // Actually, let's try to remove trailing commas which are common in TS but invalid in JSON
        const cleaned = arrayContent.replace(/,(\s*[}\]])/g, '$1');
        try {
            return {
                prefix: content.substring(0, arrayStartIndex),
                data: JSON.parse(cleaned),
                suffix: content.substring(lastIndex + 1)
            };
        } catch (e2) {
            console.error("Relaxed JSON parse failed too.");
            throw e2;
        }
    }
}

function areColorsDifferent(oldColors, newColors) {
    if (!oldColors || !newColors) return true;
    if (oldColors.length !== newColors.length) return true;

    // Compare top 3-4 dominant colors
    for (let i = 0; i < Math.min(oldColors.length, 4); i++) {
        const oldHex = oldColors[i].hex.toLowerCase();
        // Find if this hex exists in new top colors with similar rank
        // Or just strict equality of the set
        const matches = newColors.some(nc => nc.hex.toLowerCase() === oldHex);
        if (!matches) return true;
    }
    return false;
}

async function main() {
    console.log("🚀 Starting palette update process...");

    // 1. Run Python Extractor
    console.log("1️⃣  Fetching fresh color data (this may take a while)...");
    try {
        // Reducing max-pages to 3 for speed, consistent with plan
        const { stdout, stderr } = await execAsync(`python "${PYTHON_SCRIPT}" --source "${REAL_SITES_PATH}" --output "${TEMP_OUTPUT_JSON}" --max-pages 3`);
        console.log(stdout);
        if (stderr) console.warn(stderr);
    } catch (e) {
        console.error("❌ Python script failed:", e.message);
        process.exit(1);
    }

    // 2. Read Fresh Data
    let freshData = [];
    try {
        const fileContent = await readFile(TEMP_OUTPUT_JSON, 'utf8');
        freshData = JSON.parse(fileContent);
        console.log(`2️⃣  Loaded fresh data for ${freshData.length} sites.`);
    } catch (e) {
        console.error("❌ Failed to read temp_colors.json:", e.message);
        process.exit(1);
    }

    // 3. Update RealSites
    console.log("3️⃣  Updating realSites.ts...");
    try {
        const { prefix, data: currentSites, suffix } = await parseRealSites(REAL_SITES_PATH);
        let updatesCount = 0;

        const updatedSites = currentSites.map(site => {
            const freshSite = freshData.find(fs => {
                // Normalize URLs for comparison
                const siteUrl = new URL(site.url).hostname.replace('www.', '');
                const freshUrl = new URL(fs.website).hostname.replace('www.', '');
                return siteUrl === freshUrl;
            });

            if (!freshSite) return site;

            // Map fresh colors to schema
            // Helper to calculate percentage based on count relative to total
            // Note: extract_colors.py returns counts, not percentages directly in all_colors
            const totalCount = freshSite.all_colors.reduce((sum, c) => sum + c.count, 0) || 1;

            const mapColors = (colorList, usage) => colorList.map(c => ({
                hex: c.hex,
                name: "Custom",
                percentage: Math.round((c.count / totalCount) * 100),
                usage: usage
            }));

            const newTopColors = mapColors(freshSite.top_6_colors, "Primary");
            const newTextColors = mapColors(freshSite.text_colors, "Text");
            const newAllColors = mapColors(freshSite.all_colors, "General");

            // Check if changed
            if (areColorsDifferent(site.topColors, newTopColors)) {
                updatesCount++;
                console.log(`   📝 Updating ${site.name}: Colors changed.`);

                // version history entry
                const historyEntry = {
                    version: `v${(site.versions?.length || 0) + 1}.0`,
                    date: site.lastUpdated || new Date().toISOString(),
                    colors: site.topColors,
                    topColors: site.topColors,
                    textColors: site.textColors,
                    allColors: site.allColors
                };

                // Limit history to 3 previous versions
                const currentVersions = site.versions || [];
                const newVersions = [historyEntry, ...currentVersions].slice(0, 3);

                return {
                    ...site,
                    lastUpdated: new Date().toISOString(),
                    topColors: newTopColors,
                    allColors: newAllColors,
                    textColors: newTextColors,
                    versions: newVersions
                };
            }

            return site;
        });

        if (updatesCount > 0) {
            const newContent = prefix + JSON.stringify(updatedSites, null, 2) + suffix;
            await writeFile(REAL_SITES_PATH, newContent, 'utf8');
            console.log(`✅ Successfully updated ${updatesCount} sites in realSites.ts`);
        } else {
            console.log("✅ No changes detected in color palettes.");
        }

    } catch (e) {
        console.error("❌ Failed to process realSites.ts:", e);
        process.exit(1);
    }
}

main();
