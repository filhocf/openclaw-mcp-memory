/**
 * Simple glob pattern matcher.
 *
 * Supports:
 * - `*` — match any sequence (except empty when alone)
 * - `memory_*` — prefix glob
 * - `*.txt` — suffix glob
 * - `{a,b}` — alternation
 * - `?` — single char
 * - Direct string — exact match
 *
 * Does NOT support:
 * - `**` (path glob — not needed for tool names)
 * - Character classes `[...]`
 * - Escaping
 */
export function matchGlob(pattern: string, name: string): boolean {
  // Exact match
  if (!pattern.includes("*") && !pattern.includes("?") && !pattern.includes("{")) {
    return pattern === name;
  }

  // Simple glob — convert to regex
  const regexStr =
    "^" +
    pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex specials
      .replace(/\\\{([^}]+)\\\}/g, (_, alt: string) => {
        // {a,b} → (a|b)
        const alts = alt.split(",").map((s: string) => s.trim());
        return "(" + alts.map((s: string) => globPartToRegex(s)).join("|") + ")";
      })
      .replace(/\?/g, ".") // ? → single char
      .replace(/\*/g, ".*") + // * → any sequence
    "$";

  try {
    return new RegExp(regexStr).test(name);
  } catch {
    // Fallback: prefix/suffix match
    if (pattern.startsWith("*") && pattern.endsWith("*")) {
      return name.includes(pattern.slice(1, -1));
    }
    if (pattern.endsWith("*")) {
      return name.startsWith(pattern.slice(0, -1));
    }
    if (pattern.startsWith("*")) {
      return name.endsWith(pattern.slice(1));
    }
    return false;
  }
}

function globPartToRegex(part: string): string {
  return part.replace(/\?/g, ".").replace(/\*/g, ".*");
}
