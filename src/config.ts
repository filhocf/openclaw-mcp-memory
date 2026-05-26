/**
 * Plugin config schema and defaults.
 * Matches openclaw.plugin.json configSchema properties.
 */
export interface PluginConfig {
  threshold: number;
  maxResults: number;
  autoCapture: boolean;
  autoRecall: boolean;
  graphEnabled: boolean;
  dbPath?: string;
  /**
   * Glob pattern for auto-capture hook.
   * Only tool calls matching this pattern trigger auto-capture.
   * Default: "*" (all tools).
   * Examples: "memory_*" (only memory tools), "exec,fs_read" (specific tools)
   */
  captureMatcher: string;
}

export const DEFAULT_CONFIG: PluginConfig = {
  threshold: 0.7,
  maxResults: 5,
  autoCapture: true,
  autoRecall: true,
  graphEnabled: false,
  captureMatcher: "*",
};

/**
 * Resolve config from whatever context shape the plugin runtime provides.
 */
export function resolveConfig(ctxConfig: Record<string, unknown> | undefined): PluginConfig {
  if (!ctxConfig) return { ...DEFAULT_CONFIG };
  return {
    threshold: typeof ctxConfig.threshold === "number" ? ctxConfig.threshold : DEFAULT_CONFIG.threshold,
    maxResults: typeof ctxConfig.maxResults === "number" ? Math.floor(ctxConfig.maxResults) : DEFAULT_CONFIG.maxResults,
    autoCapture: typeof ctxConfig.autoCapture === "boolean" ? ctxConfig.autoCapture : DEFAULT_CONFIG.autoCapture,
    captureMatcher: typeof ctxConfig.captureMatcher === "string" ? ctxConfig.captureMatcher : DEFAULT_CONFIG.captureMatcher,
    autoRecall: typeof ctxConfig.autoRecall === "boolean" ? ctxConfig.autoRecall : DEFAULT_CONFIG.autoRecall,
    graphEnabled: typeof ctxConfig.graphEnabled === "boolean" ? ctxConfig.graphEnabled : DEFAULT_CONFIG.graphEnabled,
    dbPath: typeof ctxConfig.dbPath === "string" ? ctxConfig.dbPath : DEFAULT_CONFIG.dbPath,
  };
}
