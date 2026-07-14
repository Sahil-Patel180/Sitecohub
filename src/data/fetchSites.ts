import { supabase } from '../lib/supabaseClient';
import type { WebsiteData, Color, WebsiteVersion } from './mockData';

// Reshapes flat Supabase rows (sites + palettes + versions) back into the
// nested WebsiteData[] shape the existing components already expect.
export async function fetchAllSites(): Promise<WebsiteData[]> {
  const { data: sites, error: sitesErr } = await supabase.from('sites').select('*');
  if (sitesErr) throw sitesErr;
  if (!sites || sites.length === 0) return [];

  const { data: palettes, error: paletteErr } = await supabase.from('palettes').select('*');
  if (paletteErr) throw paletteErr;

  const { data: versions, error: versionErr } = await supabase.from('versions').select('*');
  if (versionErr) throw versionErr;

  const paletteBySite = new Map<string, typeof palettes>();
  (palettes ?? []).forEach((p) => {
    if (!paletteBySite.has(p.site_id)) paletteBySite.set(p.site_id, []);
    paletteBySite.get(p.site_id)!.push(p);
  });

  const versionsBySite = new Map<string, typeof versions>();
  (versions ?? []).forEach((v) => {
    if (!versionsBySite.has(v.site_id)) versionsBySite.set(v.site_id, []);
    versionsBySite.get(v.site_id)!.push(v);
  });

  const toColor = (p: any): Color => ({
    hex: p.color_hex,
    name: p.color_name ?? undefined,
    percentage: p.usage_pct ?? 0,
  });

  return sites.map((s): WebsiteData => {
    const sitePalettes = paletteBySite.get(s.id) ?? [];
    const siteVersions = versionsBySite.get(s.id) ?? [];

    return {
      id: s.id,
      name: s.name,
      url: s.url,
      description: s.description ?? '',
      logo: s.logo ?? undefined,
      slug: s.slug ?? undefined,
      category: s.category ?? '',
      style: (s.style ?? 'Minimalist') as WebsiteData['style'],
      primaryColorFamily: s.primary_color_family ?? '',
      likes: s.likes ?? 0,
      topColors: sitePalettes.filter((p) => p.role === 'top').map(toColor),
      allColors: sitePalettes.filter((p) => p.role === 'all').map(toColor),
      textColors: sitePalettes.filter((p) => p.role === 'text').map(toColor),
      trendingColors: sitePalettes.filter((p) => p.role === 'trending').map(toColor),
      lastUpdated: s.last_updated ?? '',
      quote: s.quote ?? undefined,
      versions: siteVersions.map(
        (v): WebsiteVersion => ({
          version: v.version,
          date: v.version_date,
          colors: Array.isArray(v.colors) ? v.colors : [],
        })
      ),
    };
  });
}