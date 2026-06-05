import type { McpClient } from "../storage/mcp-client.js";

export function createMemoryStatsTool(client: McpClient) {
  return {
    name: "memory_stats",
    description: "Retorna estatísticas da memória: total, por tipo, recentes.",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const result = await client.callTool("memory_health", {});
      if (result === null) return { success: false, data: { error: "service unavailable" } };
      return { success: true, data: result };
    },
  };
}
