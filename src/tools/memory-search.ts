import type { Tool } from "openclaw/plugin-sdk/tool";

export const memorySearchTool: Tool = {
  name: "memory_search",
  description: "Busca memórias por similaridade semântica",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Texto de busca" },
      limit: { type: "integer", default: 5 },
      threshold: { type: "number", default: 0.7 },
    },
    required: ["query"],
  },
  handler: async (args, ctx) => {
    // TODO: implementar busca híbrida (RRF)
    ctx.logger.info(`memory_search: ${args.query}`);
    return { results: [] };
  },
};
