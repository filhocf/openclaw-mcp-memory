import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { resolveConfig, type PluginConfig } from "./config.js";
import { initStorage, destroyStorage } from "./storage/sqlite.js";
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
  register: async (api: any) => {
    const logger = api.logger ?? console;

    // 1. Resolve config from the plugin runtime
    const rawConfig: Record<string, unknown> | undefined =
      api.config ?? api.pluginConfig ?? undefined;
    const config: PluginConfig = resolveConfig(rawConfig);

    logger.info("[mcp-memory] initializing with config:", JSON.stringify(config));

    // 2. Initialize storage (SQLite + schema)
    initStorage(config);
    logger.info("[mcp-memory] storage initialized");

    // 3. Initialize knowledge graph (if enabled)
    let graphStore: GraphStore | undefined;
    if (config.graphEnabled) {
      try {
        // Reuse the same db path — graph stores entities & relations in same database
        // Use the same database connection from MemoryStorage
        const { getStorage } = await import("./storage/sqlite.js");
        const storage = getStorage();
        graphStore = new GraphStore(storage.rawDb);
        graphStore.initialize();
        logger.info("[mcp-memory] knowledge graph enabled");
      } catch (err) {
        logger.warn("[mcp-memory] graph init failed (non-fatal):", String(err));
      }
    }

    // 4. Inject logger into embedding module
    setEmbedLogger({
      info: (msg) => logger.info(msg),
      warn: (msg) => logger.warn(msg),
      error: (msg) => logger.error(msg),
    });

    // 5. Warm up embedding model in background (non-blocking)
    warmup()
      .then((ok) => {
        if (ok) logger.info("[mcp-memory] embedding model warmed up");
        else logger.warn("[mcp-memory] embedding model unavailable — falling back to keyword-only search");
      })
      .catch((err) => logger.warn("[mcp-memory] embed warmup error:", String(err)));

    // 6. Register tools
    api.registerTool(createMemoryStoreTool(config));
    api.registerTool(createMemorySearchTool(config));
    api.registerTool(memoryForgetTool);
    if (graphStore) {
      api.registerTool(createMemoryStatsTool(graphStore));
    } else {
      api.registerTool(createMemoryStatsTool());
    }

    // 7. Register hooks
    api.registerHook("before_prompt_build", createAutoRecallHandler(config));
    api.registerHook("after_tool_call", createAutoCaptureHandler(config));
    api.registerHook("stop", createSessionEndHandler(config));

    logger.info(
      "[mcp-memory] plugin loaded — 4 tools, 3 hooks, " +
        `auto-capture=${config.autoCapture}, auto-recall=${config.autoRecall}`,
    );
  },
  // Cleanup on plugin unload
  unregister: () => {
    destroyStorage();
  },
});
