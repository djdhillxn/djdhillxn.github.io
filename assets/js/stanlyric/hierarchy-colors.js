const REGION_COLORS = [
  '#f05d5e',
  '#20a39e',
  '#f2c14e',
  '#4f7cac',
  '#d96c9d',
  '#4fa96c',
  '#ef8a47',
  '#8067b7',
  '#2d9cdb',
  '#b58b24',
  '#00a878',
  '#c94f7c',
  '#378f8b',
  '#d85362',
  '#66788a',
  '#c8a600',
  '#2e9b50',
  '#b33c52',
  '#7752a8',
  '#168b83',
];

const LEVEL_SEEDS = {
  region: 0,
  community: 0.173,
  neighborhood: 0.437,
};

const LEVEL_STYLE = {
  region: { saturation: 0.66, lightness: 0.56 },
  community: { saturation: 0.7, lightness: 0.59 },
  neighborhood: { saturation: 0.62, lightness: 0.64 },
};

export const HIERARCHY_LEVELS = ['region', 'community', 'neighborhood'];

export function nodeColorHex(node) {
  if (!node) return '#8c96a5';
  if (node.level === 'region') {
    return REGION_COLORS[(node.rank - 1) % REGION_COLORS.length];
  }
  const style = LEVEL_STYLE[node.level] || LEVEL_STYLE.community;
  const hue = (
    ((Number(node.level_id) + 1) * 0.61803398875)
    + (LEVEL_SEEDS[node.level] || 0)
  ) % 1;
  return hslToHex(hue, style.saturation, style.lightness);
}

export function levelLabel(level, plural = false) {
  const labels = {
    region: plural ? 'Regions' : 'Region',
    community: plural ? 'Communities' : 'Community',
    neighborhood: plural ? 'Neighborhoods' : 'Neighborhood',
  };
  return labels[level] || level;
}

function hslToHex(hue, saturation, lightness) {
  const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
  const sector = hue * 6;
  const intermediate = chroma * (1 - Math.abs((sector % 2) - 1));
  let red = 0;
  let green = 0;
  let blue = 0;

  if (sector < 1) [red, green] = [chroma, intermediate];
  else if (sector < 2) [red, green] = [intermediate, chroma];
  else if (sector < 3) [green, blue] = [chroma, intermediate];
  else if (sector < 4) [green, blue] = [intermediate, chroma];
  else if (sector < 5) [red, blue] = [intermediate, chroma];
  else [red, blue] = [chroma, intermediate];

  const match = lightness - (chroma / 2);
  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}
