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
export declare function matchGlob(pattern: string, name: string): boolean;
//# sourceMappingURL=glob.d.ts.map