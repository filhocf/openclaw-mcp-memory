import type { Tool } from "openclaw/plugin-sdk/tool";

export const memoryStoreTool: Tool = {
  name: "memory_store",
  description: "Armazena um fato na memória persistente",
  parameters: {
    type: "object",
    properties: {
      content: { type: "string", description: "Conteúdo a armazenar" },
      tags: { type: "array", items: { type: "string" }, description: "Tags para categorização" },
    },
    required: ["content"],
  },
  handler: async (args, ctx) => {
    // TODO: implementar storage via SQLite
    ctx.logger.info(`memory_store: ${args.content}`);
    return { success: true };
  },
};
