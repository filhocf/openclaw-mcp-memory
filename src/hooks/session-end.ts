/**
 * session-end hook
 *
 * Fires on session_end. Consolidates memories:
 * - Logs summary of session stats
 * - Placeholder for future auto-vacuum / stale pruning
 */

import type { PluginConfig } from "../config.js";
import { getStorage } from "../storage/sqlite.js";

export function createSessionEndHandler(config: PluginConfig) {
  return () => {
    try {
      const storage = getStorage();
      if (!storage) return;

      const stats = storage.stats();
      // Log via global — no ctx logger available in session_end untyped handler
      // eslint-disable-next-line no-console
      console.log(
        "[session-end] consolidating memories — total=" + stats.total +
        " recent=" + stats.recentCount,
      );
    } catch (_err) {
      // non-critical
    }
  };
}
