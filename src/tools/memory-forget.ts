import type { Tool } from "openclaw/plugin-sdk/tool";

export const memoryForgetTool: Tool = {
  name: "memory_forget",
  description: "Remove uma memória específica",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "ID da memória a remover" },
    },
    required: ["id"],
  },
  handler: async (args, ctx) => {
    // TODO: implementar remoção
    ctx.logger.info(`memory_forget: ${args.id}`);
    return { success: true };
  },
};
