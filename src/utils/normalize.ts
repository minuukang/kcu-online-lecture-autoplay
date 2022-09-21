export function normalizeTitle(str?: string | null) {
  return str?.replace(/\n/g, " ").trim();
}
