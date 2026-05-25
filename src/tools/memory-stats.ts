import type { Tool } from "openclaw/plugin-sdk/tool";

export const memoryStatsTool: Tool = {
  name: "memory_stats",
  description: "Retorna estatísticas da memória (total, por tipo, etc)",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async (_args, ctx) => {
    // TODO: implementar stats query
    ctx.logger.info("memory_stats");
    return { total: 0, byType: {} };
  },
};
