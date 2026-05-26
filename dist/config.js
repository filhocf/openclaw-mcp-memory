export const DEFAULT_CONFIG = {
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
export function resolveConfig(ctxConfig) {
    if (!ctxConfig)
        return { ...DEFAULT_CONFIG };
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
//# sourceMappingURL=config.js.map