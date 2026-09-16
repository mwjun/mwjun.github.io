// Color themes for the canvases. Colors are "r, g, b" strings; the Ice theme keeps every original color exactly.
export type ThemeName = "ice" | "graphite" | "brass" | "copper" | "sage" | "rosewood";
type Rgb = [number, number, number];
type Family = "a" | "b" | "c";

export const THEME_CHANGE_EVENT = "themechange";

// The original Ice colors each canvas color is measured against: a = primary tone, b = secondary tone, c = glow tone.
const ICE_REFERENCE: Record<Family, Rgb> = { a: [185, 233, 230], b: [192, 184, 239], c: [55, 111, 160] };
const PALETTES: Record<Exclude<ThemeName, "ice">, Record<Family, Rgb>> = {
  graphite: { a: [232, 230, 225], b: [125, 122, 116], c: [90, 90, 95] },
  brass: { a: [212, 180, 131], b: [138, 143, 152], c: [120, 96, 60] },
  copper: { a: [224, 164, 122], b: [111, 134, 179], c: [60, 80, 130] },
  sage: { a: [185, 207, 166], b: [217, 201, 163], c: [70, 100, 80] },
  rosewood: { a: [227, 166, 161], b: [154, 163, 181], c: [110, 70, 80] },
};

export const currentTheme = (): ThemeName => {
  const theme = typeof document === "undefined" ? undefined : document.documentElement.dataset.theme;
  return theme && theme in PALETTES ? (theme as ThemeName) : "ice";
};

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const cache = new Map<string, string>();

/** Recolors an original Ice color into the active theme, keeping its brightness relative to its color family. */
export function themed(rgb: string, family: Family): string {
  const theme = currentTheme();
  if (theme === "ice") return rgb;
  const key = `${theme}|${family}|${rgb}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const input = rgb.split(",").map(Number) as Rgb;
  const scale = luminance(input) / luminance(ICE_REFERENCE[family]);
  const value = PALETTES[theme][family].map(channel => Math.max(0, Math.min(255, Math.round(channel * scale)))).join(", ");
  cache.set(key, value);
  return value;
}
