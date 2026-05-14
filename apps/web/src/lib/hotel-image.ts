/**
 * Deterministic per-hotel cover image.
 *
 * We hash the hotel name into one of a hand-picked set of stable Unsplash
 * photos so every hotel gets a stable, distinct visual identity without
 * managing image assets ourselves. The set is intentionally varied (luxury,
 * resort, beach, mountain, urban) so the grid feels alive.
 *
 * Each ID was verified to resolve over HTTP at the time of writing. If
 * Unsplash ever retires one, the gradient backdrop on HotelCard keeps the
 * layout intact while the image fails silently.
 */
const PHOTO_IDS = [
  '1566073771259-6a8506099945', // luxury hotel exterior
  '1542314831-068cd1dbfeeb',    // modern hotel room
  '1455587734955-081b22074882', // resort pool
  '1520250497591-112f2f40a3f4', // boutique hotel
  '1551882547-ff40c63fe5fa',    // mountain lodge
  '1564501049412-61c2a3083791', // beach resort pool
  '1582719508461-905c673771fd', // tropical beach hotel
  '1568084680786-a84f91d1153c', // winter resort
  '1535827841776-24afc1e255ac', // luxurious lobby
  '1538688525198-9b88f6f53126', // city hotel skyline
  '1611892440504-42a792e24d32', // luxury suite
  '1578683010236-d716f9a3f461', // desert resort
  '1551918120-9739cb430c6d',    // palm resort
  '1540541338287-41700207dee6', // cabin in forest
  '1564013799919-ab600027ffc6', // urban modern hotel
  '1517840901100-8179e982acb7', // boutique exterior
] as const;

const UNSPLASH_BASE = 'https://images.unsplash.com/photo-';

export interface HotelImage {
  src: string;
  /** Smaller variant suitable for blur placeholders / list thumbnails. */
  thumb: string;
}

export function getHotelImage(name: string, width = 800): HotelImage {
  // djb2-style hash matches getHotelGradient so cover image and fallback
  // gradient stay correlated when both are visible.
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  const id = PHOTO_IDS[h % PHOTO_IDS.length]!;
  const params = (w: number) => `?w=${w}&auto=format&fit=crop&q=80`;
  return {
    src: `${UNSPLASH_BASE}${id}${params(width)}`,
    thumb: `${UNSPLASH_BASE}${id}${params(48)}`,
  };
}
