/** Tiny dependency-free id generator (uuid-shaped, not RFC-4122). */
export function newId(prefix: string): string {
  const rand = Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0');
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
