/**
 * session-end hook
 *
 * Fires on session_end. Consolidates memories:
 * - Logs summary of session stats
 * - Placeholder for future auto-vacuum / stale pruning
 */
import type { PluginConfig } from "../config.js";
export declare function createSessionEndHandler(config: PluginConfig): () => void;
//# sourceMappingURL=session-end.d.ts.map