// Extracts a site's actual rendered color palette using headless Chrome +
// getComputedStyle, so it works regardless of framework (React/Vue/Next/etc)
// or how colors are declared (CSS vars, Tailwind utilities, inline styles).

import puppeteer from 'puppeteer';

// Convert any computed color string (rgb/rgba/hex) to a normalized hex string.
// Returns null for transparent/invalid colors.
function toHex(colorStr) {
  if (!colorStr) return null;
  const rgbaMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/i);
  if (!rgbaMatch) return null;
  const [, r, g, b, a] = rgbaMatch;
  if (a !== undefined && parseFloat(a) === 0) return null; // fully transparent
  const toH = (n) => parseInt(n, 10).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

export async function extractColors(url, { timeoutMs = 20000 } = {}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
    // Small settle delay for late client-side renders (React/Vue hydration, animations)
    await new Promise((r) => setTimeout(r, 1500));

    const rawSamples = await page.evaluate(() => {
      const samples = [];
      const nodes = document.querySelectorAll('body *');

      nodes.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area <= 0) return;

        const hasText = el.childNodes && Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
        );

        samples.push({
          area,
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderTopColor,
          hasText,
        });
      });

      return samples;
    });

    await page.close();
    return aggregateSamples(rawSamples);
  } finally {
    await browser.close();
  }
}

function aggregateSamples(samples) {
  const textWeights = new Map(); // hex -> total weight
  const bgWeights = new Map();

  for (const s of samples) {
    if (s.hasText) {
      const hex = toHex(s.color);
      if (hex) textWeights.set(hex, (textWeights.get(hex) ?? 0) + s.area);
    }
    const bgHex = toHex(s.backgroundColor);
    if (bgHex) bgWeights.set(bgHex, (bgWeights.get(bgHex) ?? 0) + s.area);

    const borderHex = toHex(s.borderColor);
    if (borderHex) bgWeights.set(borderHex, (bgWeights.get(borderHex) ?? 0) + s.area * 0.2); // borders weighted lower
  }

  const toRanked = (weightMap, limit) => {
    const total = Array.from(weightMap.values()).reduce((sum, w) => sum + w, 0) || 1;
    return Array.from(weightMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([hex, weight]) => ({
        hex,
        percentage: Math.round((weight / total) * 1000) / 10, // one decimal
      }));
  };

  const textColors = toRanked(textWeights, 10);
  const bgColors = toRanked(bgWeights, 15);

  // "all" = merged, deduped, re-ranked by combined weight
  const combined = new Map();
  for (const [hex, w] of textWeights) combined.set(hex, (combined.get(hex) ?? 0) + w);
  for (const [hex, w] of bgWeights) combined.set(hex, (combined.get(hex) ?? 0) + w);
  const allColors = toRanked(combined, 20);
  const topColors = allColors.slice(0, 8);

  return { topColors, allColors, textColors };
}