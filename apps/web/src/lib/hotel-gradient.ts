/**
 * Deterministic per-hotel duotone gradient.
 *
 * We hash the hotel name into one of a curated set of bright Tailwind gradients
 * so every hotel gets a stable, distinct visual identity without needing image
 * assets. The palette is hand-picked to feel "alive" while staying tonally
 * coherent with the Tropical Joy brand (turquoise + sunshine + peach).
 */
const PALETTES = [
  'from-cyan-400 via-sky-400 to-teal-300',
  'from-amber-300 via-orange-300 to-rose-300',
  'from-emerald-400 via-teal-400 to-cyan-300',
  'from-fuchsia-400 via-pink-400 to-orange-300',
  'from-yellow-300 via-amber-400 to-rose-300',
  'from-sky-400 via-cyan-300 to-emerald-300',
  'from-violet-400 via-fuchsia-400 to-rose-300',
  'from-lime-300 via-emerald-400 to-teal-300',
] as const;

export function getHotelGradient(name: string): string {
  // djb2-style fast hash; >>> 0 keeps it a positive uint32 for the modulo.
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTES[h % PALETTES.length]!;
}
