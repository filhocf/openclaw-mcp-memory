import type { PluginConfig } from "../config.js";
import type { McpClient } from "../storage/mcp-client.js";
import type { FallbackStore } from "../storage/fallback.js";
import { matchGlob } from "../glob.js";

interface ToolCallEvent {
  name?: string;
  toolName?: string;
  arguments?: Record<string, unknown>;
  args?: Record<string, unknown>;
  result?: unknown;
  output?: unknown;
  response?: unknown;
}

export function createAutoCaptureHandler(config: PluginConfig, client: McpClient, fallback: FallbackStore) {
  return async (event: ToolCallEvent, ctx: { logger?: { info?: (msg: string) => void } }) => {
    if (!config.autoCapture) return;

    const toolName = event?.name ?? event?.toolName ?? "";
    const toolResult = event?.result ?? event?.output ?? event?.response;
    if (!toolName || toolName.startsWith("memory_")) return;
    if (!matchGlob(config.captureMatcher, toolName)) return;

    const content = extractContent(toolName, toolResult);
    if (!content) return;

    const toolArgs = { content, metadata: { tags: toolName, type: "fact" } };
    const result = await client.callTool("memory_store", toolArgs);
    if (result === null) await fallback.append("memory_store", toolArgs);
    else ctx.logger?.info?.(`[auto-capture] stored from "${toolName}"`);
  };
}

function extractContent(toolName: string, result: unknown): string | null {
  if (typeof result === "string" && result.length > 20) return result.slice(0, 300);
  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;
    for (const f of ["result", "output", "content", "response", "text", "summary"]) {
      if (typeof obj[f] === "string" && String(obj[f]).length > 20) return String(obj[f]).slice(0, 300);
    }
  }
  return null;
}
