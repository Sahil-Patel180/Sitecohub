// Extracts a site's actual rendered color palette using headless Chrome +
// getComputedStyle, so it works regardless of framework (React/Vue/Next/etc)
// or how colors are declared (CSS vars, Tailwind utilities, inline styles).
//
// Phase 1: gradient color stops (background-image: linear/radial-gradient)
// Phase 2: SVG fill/stroke (icon & logo brand colors)
// Phase 3: shadow DOM traversal (Web Components / Lit / Stencil / design systems)

import puppeteer from 'puppeteer';

// Convert any single computed color string (rgb/rgba) to a normalized hex string.
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

// Extract every rgb()/rgba() color stop out of a gradient string
// (computed backgroundImage always normalizes to rgb()/rgba(), never hex/keywords).
function extractGradientHexes(bgImageStr) {
  if (!bgImageStr || !bgImageStr.includes('gradient')) return [];
  const matches = bgImageStr.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\)/gi) || [];
  return matches.map(toHex).filter(Boolean);
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

      // Recursive walker that pierces shadow roots (Phase 3) so Web Component
      // internals (Lit, Stencil, and many design systems) aren't invisible.
      function walk(root) {
        const nodes = root.querySelectorAll('*');
        nodes.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return;

          const rect = el.getBoundingClientRect();
          const area = rect.width * rect.height;

          if (area > 0) {
            const hasText = el.childNodes && Array.from(el.childNodes).some(
              (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
            );

            const isSvgEl = el.namespaceURI === 'http://www.w3.org/2000/svg';

            samples.push({
              area,
              color: style.color,
              backgroundColor: style.backgroundColor,
              backgroundImage: style.backgroundImage, // Phase 1: gradients live here
              borderColor: style.borderTopColor,
              hasText,
              // Phase 2: SVG presentation properties resolve through computed style too
              svgFill: isSvgEl ? style.fill : null,
              svgStroke: isSvgEl ? style.stroke : null,
            });
          }

          // Phase 3: descend into shadow root if this element hosts one
          if (el.shadowRoot) {
            walk(el.shadowRoot);
          }
        });
      }

      walk(document.body ?? document);
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

    // Phase 1: gradient stops, each stop gets a share of the element's area
    const gradientHexes = extractGradientHexes(s.backgroundImage);
    if (gradientHexes.length > 0) {
      const perStopWeight = s.area / gradientHexes.length;
      for (const hex of gradientHexes) {
        bgWeights.set(hex, (bgWeights.get(hex) ?? 0) + perStopWeight);
      }
    }

    const borderHex = toHex(s.borderColor);
    if (borderHex) bgWeights.set(borderHex, (bgWeights.get(borderHex) ?? 0) + s.area * 0.2); // borders weighted lower

    // Phase 2: SVG fill/stroke folded into the background/brand bucket
    const fillHex = toHex(s.svgFill);
    if (fillHex) bgWeights.set(fillHex, (bgWeights.get(fillHex) ?? 0) + s.area * 0.5);

    const strokeHex = toHex(s.svgStroke);
    if (strokeHex) bgWeights.set(strokeHex, (bgWeights.get(strokeHex) ?? 0) + s.area * 0.3);
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