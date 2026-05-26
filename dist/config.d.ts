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
export declare const DEFAULT_CONFIG: PluginConfig;
/**
 * Resolve config from whatever context shape the plugin runtime provides.
 */
export declare function resolveConfig(ctxConfig: Record<string, unknown> | undefined): PluginConfig;
//# sourceMappingURL=config.d.ts.map