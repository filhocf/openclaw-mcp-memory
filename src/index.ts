import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { memoryStoreTool } from "./tools/memory-store.js";
import { memorySearchTool } from "./tools/memory-search.js";
import { memoryForgetTool } from "./tools/memory-forget.js";
import { memoryStatsTool } from "./tools/memory-stats.js";
import { autoRecallHandler } from "./hooks/auto-recall.js";
import { autoCaptureHandler } from "./hooks/auto-capture.js";
import { sessionEndHandler } from "./hooks/session-end.js";

export default definePluginEntry({
  id: "mcp-memory",
  register: (api) => {
    // Tools
    api.registerTool(memoryStoreTool);
    api.registerTool(memorySearchTool);
    api.registerTool(memoryForgetTool);
    api.registerTool(memoryStatsTool);

    // Hooks
    api.registerHook("before_prompt_build", autoRecallHandler);
    api.registerHook("after_tool_call", autoCaptureHandler);
    api.registerHook("stop", sessionEndHandler);

    api.logger.info("[mcp-memory] plugin loaded");
  },
});
