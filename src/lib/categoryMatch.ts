/**
 * Reverse lookup: maps translated category values back to their keys.
 * Covers all languages (EN, PT) so attendance matching works regardless
 * of which language was active when the session was created.
 */
const TRANSLATED_TO_KEY: Record<string, string> = {
  // EN
  'first team': 'firstteam',
  'u23': 'u23',
  'u21': 'u21',
  'u18': 'u18',
  'u16': 'u16',
  'academy': 'academy',
  // PT
  'time principal': 'firstteam',
  'sub-23': 'u23',
  'sub-21': 'u21',
  'sub-18': 'u18',
  'sub-16': 'u16',
  'academia': 'academy',
};

/**
 * Normalize a category value (key or translated string) to a lowercase key
 * suitable for comparison.
 */
export function normalizeCategoryForMatch(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return TRANSLATED_TO_KEY[trimmed] ?? trimmed;
}

/**
 * Check if any of the session's categories match a goalkeeper's category.
 * Handles the mismatch where sessions may store translated values
 * (e.g. "Time Principal") while goalkeepers store keys (e.g. "firstTeam").
 */
export function categoriesMatch(
  sessionCategory: string | string[],
  gkCategory: string
): boolean {
  const cats = Array.isArray(sessionCategory) ? sessionCategory : [sessionCategory];
  if (cats.length === 0) return false;

  const normalizedGk = normalizeCategoryForMatch(gkCategory);

  return cats.some(cat => normalizeCategoryForMatch(cat) === normalizedGk);
}
