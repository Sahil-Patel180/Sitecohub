// One-time migration: src/data/realSites.ts -> Supabase (sites, palettes, versions)
// Run: node scripts/migrate_to_supabase.mjs
// Needs env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (service_role, NOT anon key)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function loadRealSites() {
  const filePath = path.join(__dirname, '../src/data/realSites.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const realSites.*?=\s*(\[[\s\S]*\]);/);
  if (!match) throw new Error('Could not locate realSites array in file.');
  return JSON.parse(match[1]);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function migrate() {
  const sites = loadRealSites();
  console.log(`Loaded ${sites.length} sites from realSites.ts`);

  for (const site of sites) {
    const { data: siteRow, error: siteErr } = await supabase
      .from('sites')
      .upsert(
        {
          name: site.name,
          url: site.url,
          category: site.category,
          logo: site.logo ?? null,
          description: site.description ?? null,
          style: site.style ?? null,
          primary_color_family: site.primaryColorFamily ?? null,
          likes: site.likes ?? 0,
          last_updated: site.lastUpdated ?? null,
          quote: site.quote ?? null,
        },
        { onConflict: 'name' }
      )
      .select()
      .single();

    if (siteErr) {
      console.error(`Failed to upsert site ${site.name}:`, siteErr.message);
      continue;
    }

    const siteId = siteRow.id;

    const paletteRows = [];
    const buckets = [
      ['top', site.topColors],
      ['all', site.allColors],
      ['text', site.textColors],
      ['trending', site.trendingColors],
    ];
    for (const [role, colors] of buckets) {
      if (!Array.isArray(colors)) continue;
      for (const c of colors) {
        paletteRows.push({
          site_id: siteId,
          color_hex: c.hex,
          color_name: c.name ?? null,
          role,
          usage_pct: c.percentage ?? null,
        });
      }
    }

    if (paletteRows.length) {
      for (const batch of chunk(paletteRows, 500)) {
        const { error: paletteErr } = await supabase.from('palettes').insert(batch);
        if (paletteErr) console.error(`  palette insert error (${site.name}):`, paletteErr.message);
      }
    }

    if (Array.isArray(site.versions) && site.versions.length) {
      const versionRows = site.versions.map((v) => ({
        site_id: siteId,
        version: v.version,
        version_date: v.date,
        colors: v.colors ?? v.topColors ?? [],
      }));
      const { error: versionErr } = await supabase.from('versions').insert(versionRows);
      if (versionErr) console.error(`  version insert error (${site.name}):`, versionErr.message);
    }

    console.log(`Migrated: ${site.name} (${paletteRows.length} colors)`);
  }

  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});