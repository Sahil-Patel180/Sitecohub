import type { WebsiteData } from '../data/mockData';

interface ColorStat {
    hex: string;
    count: number;
    percentage: number; // Global percentage of sites using this color
}

/**
 * analyzes all websites to find the most commonly used colors.
 * @param sites Array of WebsiteData
 * @param limit Number of top colors to return
 * @returns Array of ColorStat
 */
export const getGlobalTrendingColors = (sites: WebsiteData[], limit: number = 50): ColorStat[] => {
    if (!sites || !Array.isArray(sites)) {
        console.warn("getGlobalTrendingColors: sites is not an array", sites);
        return [];
    }

    const colorCounts = new Map<string, number>();
    let totalSites = sites.length;

    sites.forEach(site => {
        // We only count a color once per site to see "how many sites use this color"
        // rather than "how many times this color appears in a single site's palette"
        const uniqueSiteColors = new Set<string>();

        // Consider topColors as the primary source of truth for "used" colors
        site.topColors?.forEach(c => {
            if (c.hex) uniqueSiteColors.add(c.hex.toLowerCase());
        });

        // Optionally consider allColors if we want a broader net, 
        // but topColors is usually more representative of "branding"
        // site.allColors?.forEach(c => {
        //   if (c.hex) uniqueSiteColors.add(c.hex.toLowerCase());
        // });

        uniqueSiteColors.forEach(hex => {
            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        });
    });

    const sortedColors = Array.from(colorCounts.entries())
        .map(([hex, count]) => ({
            hex,
            count,
            percentage: Math.round((count / totalSites) * 100)
        }))
        .sort((a, b) => b.count - a.count);

    return sortedColors.slice(0, limit);
};
