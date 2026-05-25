import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { resolveConfig, type PluginConfig } from "./config.js";
import { initStorage, getStorage, destroyStorage } from "./storage/sqlite.js";
import { GraphStore } from "./storage/graph.js";
import { warmup, setEmbedLogger } from "./storage/embeddings.js";
import { createMemoryStoreTool } from "./tools/memory-store.js";
import { createMemorySearchTool } from "./tools/memory-search.js";
import { memoryForgetTool } from "./tools/memory-forget.js";
import { createMemoryStatsTool } from "./tools/memory-stats.js";
import { createAutoRecallHandler } from "./hooks/auto-recall.js";
import { createAutoCaptureHandler } from "./hooks/auto-capture.js";
import { createSessionEndHandler } from "./hooks/session-end.js";

export default definePluginEntry({
  id: "mcp-memory",
  // name/description estão no openclaw.plugin.json

  register: (api) => {
    const logger = api.logger;

    // 1. Resolve config from the plugin runtime
    const rawConfig: Record<string, unknown> | undefined =
      (api as Record<string, unknown>).config as Record<string, unknown> | undefined ??
      (api as Record<string, unknown>).pluginConfig as Record<string, unknown> | undefined;
    const config: PluginConfig = resolveConfig(rawConfig);

    logger.info("[mcp-memory] initializing with config: " + JSON.stringify(config));

    // 2. Initialize storage (SQLite + schema) — synchronous
    initStorage(config);
    logger.info("[mcp-memory] storage initialized");

    // 3. Initialize knowledge graph (if enabled) — synchronous
    let graphStore: GraphStore | undefined;
    if (config.graphEnabled) {
      try {
        graphStore = new GraphStore(getStorage().rawDb);
        graphStore.initialize();
        logger.info("[mcp-memory] knowledge graph enabled");
      } catch (err) {
        logger.warn("[mcp-memory] graph init failed (non-fatal): " + String(err));
      }
    }

    // 4. Inject logger into embedding module
    setEmbedLogger({
      info: (msg) => logger.info(msg),
      warn: (msg) => logger.warn(msg),
      error: (msg) => logger.error(msg),
    });

    // 5. Warm up embedding model in background (fire-and-forget — doesn't block register)
    warmup()
      .then((ok) => {
        if (ok) logger.info("[mcp-memory] embedding model warmed up");
        else logger.warn("[mcp-memory] embedding model unavailable — keyword-only fallback");
      })
      .catch((err) => logger.warn("[mcp-memory] embed warmup error: " + String(err)));

    // 6. Register tools
    api.registerTool(createMemoryStoreTool(config));
    api.registerTool(createMemorySearchTool(config));
    api.registerTool(memoryForgetTool);
    api.registerTool(graphStore ? createMemoryStatsTool(graphStore) : createMemoryStatsTool());

    // 7. Register hooks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.registerHook("before_prompt_build", createAutoRecallHandler(config) as any);
    api.registerHook("after_tool_call", createAutoCaptureHandler(config));
    api.registerHook("session_end", createSessionEndHandler(config));

    logger.info(
      "[mcp-memory] plugin loaded — 4 tools, 3 hooks" +
        ", auto-capture=" + config.autoCapture +
        ", auto-recall=" + config.autoRecall,
    );
  },

  unregister: () => {
    destroyStorage();
  },
});
