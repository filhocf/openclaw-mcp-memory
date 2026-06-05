import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { resolveConfig, type PluginConfig } from "./config.js";
import { McpClient } from "./storage/mcp-client.js";
import { FallbackStore } from "./storage/fallback.js";
import { createMemoryStoreTool } from "./tools/memory-store.js";
import { createMemorySearchTool } from "./tools/memory-search.js";
import { createMemoryForgetTool } from "./tools/memory-forget.js";
import { createMemoryStatsTool } from "./tools/memory-stats.js";
import { createAutoRecallHandler } from "./hooks/auto-recall.js";
import { createAutoCaptureHandler } from "./hooks/auto-capture.js";
import { createSessionEndHandler } from "./hooks/session-end.js";

export default definePluginEntry({
  id: "mcp-memory",

  register: (api) => {
    const logger = api.logger;

    const rawConfig: Record<string, unknown> | undefined =
      (api as Record<string, unknown>).config as Record<string, unknown> | undefined ??
      (api as Record<string, unknown>).pluginConfig as Record<string, unknown> | undefined;
    const config: PluginConfig = resolveConfig(rawConfig);

    logger.info("[mcp-memory] initializing with config: " + JSON.stringify(config));

    const client = new McpClient(config.serviceUrl);
    const fallback = new FallbackStore(config.fallbackPath);

    // Drain fallback in background if service is available
    client.isAvailable().then(async (ok) => {
      if (!ok) { logger.warn("[mcp-memory] service unavailable, will use fallback"); return; }
      const items = await fallback.drain();
      if (items.length > 0) {
        for (const item of items) await client.callTool(item.tool, item.args);
        logger.info(`[mcp-memory] drained ${items.length} fallback items`);
      }
    }).catch(() => {});

    // Register tools
    api.registerTool(createMemoryStoreTool(client, fallback) as any);
    api.registerTool(createMemorySearchTool(client, config) as any);
    api.registerTool(createMemoryForgetTool(client, fallback) as any);
    api.registerTool(createMemoryStatsTool(client) as any);

    // Register hooks
    (api as any).registerHook("before_prompt_build", createAutoRecallHandler(config, client), { name: "mcp-memory-auto-recall" });
    (api as any).registerHook("after_tool_call", createAutoCaptureHandler(config, client, fallback), { name: "mcp-memory-auto-capture" });
    (api as any).registerHook("session_end", createSessionEndHandler(client), { name: "mcp-memory-session-end" });

    logger.info("[mcp-memory] plugin loaded — 4 tools, 3 hooks, thin-client mode");
  },
});
