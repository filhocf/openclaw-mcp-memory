import { getStorage } from "../storage/sqlite.js";

export const memoryForgetTool = {
  name: "memory_forget",
  description: "Remove uma memória específica pelo content_hash.",
  parameters: {
    type: "object",
    properties: {
      content_hash: { type: "string", description: "Hash SHA-256 (16 hex chars) da memória a remover" },
    },
    required: ["content_hash"],
  },
  execute: async (_toolCallId: string, args: unknown) => {
    const p = args as Record<string, unknown>;
    const hash = String(p.content_hash);
    const deleted = getStorage().deleteByHash(hash);
    return { success: deleted, data: { deleted } };
  },
};
