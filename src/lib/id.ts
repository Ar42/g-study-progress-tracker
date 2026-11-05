/** Generates a sheet row id in the same shape the app has always used (e.g. "ch-1781644411187-116"). */
export function generateRowId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
