// Scheduled palette update job.
// Run: node --env-file=.env scripts/update_palettes.mjs
// Needs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service_role, server-side only)

import { createClient } from '@supabase/supabase-js';
import { extractColors } from './extract_colors.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Simple set-based diff: did the top color set actually change vs last time?
function paletteChanged(oldTop, newTop) {
  const oldSet = new Set((oldTop ?? []).map((c) => c.hex));
  const newSet = new Set((newTop ?? []).map((c) => c.hex));
  if (oldSet.size !== newSet.size) return true;
  for (const hex of newSet) if (!oldSet.has(hex)) return true;
  return false;
}

async function run() {
  const { data: sites, error } = await supabase.from('sites').select('id, name, url');
  if (error) {
    console.error('Failed to load sites:', error.message);
    process.exit(1);
  }

  console.log(`Updating palettes for ${sites.length} sites...`);

  for (const site of sites) {
    try {
      console.log(`Extracting: ${site.name} (${site.url})`);
      const { topColors, allColors, textColors } = await extractColors(site.url);

      if (topColors.length === 0 && allColors.length === 0) {
        console.warn(`  No colors extracted for ${site.name}, skipping.`);
        continue;
      }

      // fetch previous top colors (most recent snapshot) to detect real change
      const { data: prevPalette } = await supabase
        .from('palettes')
        .select('color_hex, usage_pct, snapshot_date')
        .eq('site_id', site.id)
        .eq('role', 'top')
        .order('snapshot_date', { ascending: false })
        .limit(10);

      const prevTop = (prevPalette ?? []).map((p) => ({ hex: p.color_hex }));
      const changed = paletteChanged(prevTop, topColors);

      // remove today's rows for this site+role set (idempotent re-run) then insert fresh
      await supabase.from('palettes').delete().eq('site_id', site.id).eq('snapshot_date', today);

      const rows = [
        ...topColors.map((c) => ({ site_id: site.id, color_hex: c.hex, role: 'top', usage_pct: c.percentage, snapshot_date: today })),
        ...allColors.map((c) => ({ site_id: site.id, color_hex: c.hex, role: 'all', usage_pct: c.percentage, snapshot_date: today })),
        ...textColors.map((c) => ({ site_id: site.id, color_hex: c.hex, role: 'text', usage_pct: c.percentage, snapshot_date: today })),
      ];

      const { error: insertErr } = await supabase.from('palettes').insert(rows);
      if (insertErr) {
        console.error(`  Insert failed for ${site.name}:`, insertErr.message);
        continue;
      }

      await supabase.from('sites').update({ last_updated: today }).eq('id', site.id);

      if (changed) {
        await supabase.from('versions').insert({
          site_id: site.id,
          version: `v-${today}`,
          version_date: today,
          colors: topColors,
        });
        console.log(`  Updated + versioned (palette changed): ${site.name}`);
      } else {
        console.log(`  Updated (no change): ${site.name}`);
      }
    } catch (err) {
      console.error(`  Failed: ${site.name} -`, err.message);
    }
  }

  console.log('Palette update run complete.');
}

run();