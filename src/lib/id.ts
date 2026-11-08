/** Generates a sheet row id in the same shape the app has always used (e.g. "ch-1781644411187-116"). */
export function generateRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/** `count` ids guaranteed unique among themselves (distinct timestamps), same shape as generateRowId. */
export function generateRowIds(prefix: string, count: number): string[] {
  const base = Date.now();
  const rand = Math.floor(Math.random() * 1000);
  return Array.from({ length: count }, (_, i) => `${prefix}-${base + i}-${rand}`);
}
