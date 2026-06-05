import type { McpClient } from "../storage/mcp-client.js";
import type { FallbackStore } from "../storage/fallback.js";

export function createMemoryForgetTool(client: McpClient, fallback: FallbackStore) {
  return {
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
      const toolArgs = { content_hash: String(p.content_hash) };
      const result = await client.callTool("memory_delete", toolArgs);
      if (result === null) {
        await fallback.append("memory_delete", toolArgs);
        return { success: true, data: { queued: true } };
      }
      return { success: true, data: result };
    },
  };
}
