
// Basic color palette for clustering
const COLOR_PALETTE: { name: string; rgb: [number, number, number] }[] = [
    { name: 'Black', rgb: [0, 0, 0] },
    { name: 'White', rgb: [255, 255, 255] },
    { name: 'Gray', rgb: [128, 128, 128] },
    { name: 'Red', rgb: [255, 0, 0] },
    { name: 'Red', rgb: [200, 0, 0] }, // Darker Red
    { name: 'Orange', rgb: [255, 165, 0] },
    { name: 'Yellow', rgb: [255, 255, 0] },
    { name: 'Green', rgb: [0, 128, 0] },
    { name: 'Green', rgb: [0, 255, 0] }, // Lime
    { name: 'Cyan', rgb: [0, 255, 255] },
    { name: 'Blue', rgb: [0, 0, 255] },
    { name: 'Blue', rgb: [0, 100, 255] }, // Tech Blue
    { name: 'Purple', rgb: [128, 0, 128] },
    { name: 'Pink', rgb: [255, 192, 203] },
    { name: 'Pink', rgb: [255, 20, 147] }, // Deep Pink
];

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : null;
}

// Helper to calculate Euclidean distance between two colors
function getDistance(c1: [number, number, number], c2: [number, number, number]): number {
    return Math.sqrt(
        Math.pow(c1[0] - c2[0], 2) +
        Math.pow(c1[1] - c2[1], 2) +
        Math.pow(c1[2] - c2[2], 2)
    );
}

export function getNearestColorFamily(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return 'Unknown';

    let minDistance = Infinity;
    let nearestFamily = 'Unknown';

    for (const color of COLOR_PALETTE) {
        const distance = getDistance(rgb, color.rgb);
        if (distance < minDistance) {
            minDistance = distance;
            nearestFamily = color.name;
        }
    }

    return nearestFamily;
}
