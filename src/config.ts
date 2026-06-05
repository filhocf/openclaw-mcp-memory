/**
 * Plugin config schema and defaults.
 */
import { homedir } from "os";
import { join } from "path";

export interface PluginConfig {
  threshold: number;
  maxResults: number;
  autoCapture: boolean;
  autoRecall: boolean;
  serviceUrl: string;
  fallbackPath: string;
  captureMatcher: string;
}

export const DEFAULT_CONFIG: PluginConfig = {
  threshold: 0.7,
  maxResults: 5,
  autoCapture: true,
  autoRecall: true,
  serviceUrl: "http://127.0.0.1:3202/mcp",
  fallbackPath: join(homedir(), ".openclaw", "workspace", "MEMORY-FALLBACK.md"),
  captureMatcher: "*",
};

export function resolveConfig(ctxConfig: Record<string, unknown> | undefined): PluginConfig {
  if (!ctxConfig) return { ...DEFAULT_CONFIG };
  return {
    threshold: typeof ctxConfig.threshold === "number" ? ctxConfig.threshold : DEFAULT_CONFIG.threshold,
    maxResults: typeof ctxConfig.maxResults === "number" ? Math.floor(ctxConfig.maxResults) : DEFAULT_CONFIG.maxResults,
    autoCapture: typeof ctxConfig.autoCapture === "boolean" ? ctxConfig.autoCapture : DEFAULT_CONFIG.autoCapture,
    autoRecall: typeof ctxConfig.autoRecall === "boolean" ? ctxConfig.autoRecall : DEFAULT_CONFIG.autoRecall,
    serviceUrl: typeof ctxConfig.serviceUrl === "string" ? ctxConfig.serviceUrl : DEFAULT_CONFIG.serviceUrl,
    fallbackPath: typeof ctxConfig.fallbackPath === "string" ? ctxConfig.fallbackPath : DEFAULT_CONFIG.fallbackPath,
    captureMatcher: typeof ctxConfig.captureMatcher === "string" ? ctxConfig.captureMatcher : DEFAULT_CONFIG.captureMatcher,
  };
}
