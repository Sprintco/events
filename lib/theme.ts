export const THEMES = [
  { id: "light", label: "Light", top: "#f4eff0", left: "#e3d8db", right: "#b10f32" },
  { id: "dark", label: "Dark", top: "#17100e", left: "#2d201d", right: "#e0244a" },
  { id: "black", label: "Black", top: "#000000", left: "#1c1c1c", right: "#e0244a" },
  { id: "reading", label: "Easy reading", top: "#f6f0e1", left: "#ddd2ba", right: "#9c0e2c" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const TEXT_SIZES = [
  { id: "sm", label: "Small", px: 14 },
  { id: "md", label: "Default", px: 16 },
  { id: "lg", label: "Large", px: 18 },
  { id: "xl", label: "Extra large", px: 20 },
] as const;

export type TextSizeId = (typeof TEXT_SIZES)[number]["id"];

export const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);
export const isTextSize = (v: unknown): v is TextSizeId => TEXT_SIZES.some((t) => t.id === v);

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  try { localStorage.setItem("theme", id); } catch { /* ignore */ }
}

export function applyTextSize(id: TextSizeId) {
  document.documentElement.dataset.text = id;
  try { localStorage.setItem("text-size", id); } catch { /* ignore */ }
}

/** Reads what the pre-paint script already applied to <html>. */
export function readAppearance(): { theme: ThemeId; text: TextSizeId } {
  const t = document.documentElement.dataset.theme;
  const s = document.documentElement.dataset.text;
  return { theme: isTheme(t) ? t : "light", text: isTextSize(s) ? s : "md" };
}
