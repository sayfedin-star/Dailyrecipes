/**
 * Normalizes a category string to consistent casing (Capitalized First Letter, rest lowercase).
 * E.g., "salad" -> "Salad", "Dinner" -> "Dinner", "EASY" -> "Easy"
 */
export function formatCategory(category: string): string {
  if (!category) return "";
  const trimmed = category.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
