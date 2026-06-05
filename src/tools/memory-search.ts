import type { McpClient } from "../storage/mcp-client.js";
import type { PluginConfig } from "../config.js";

export function createMemorySearchTool(client: McpClient, config: PluginConfig) {
  return {
    name: "memory_search",
    description: "Busca memórias por similaridade semântica. Retorna resultados ranqueados.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Texto para busca semântica" },
        limit: { type: "integer", default: config.maxResults, description: "Número máximo de resultados" },
        threshold: { type: "number", default: config.threshold, description: "Score mínimo (0–1)" },
      },
      required: ["query"],
    },
    execute: async (_toolCallId: string, args: unknown) => {
      const p = args as Record<string, unknown>;
      const toolArgs = {
        query: String(p.query),
        limit: typeof p.limit === "number" ? p.limit : config.maxResults,
      };
      const result = await client.callTool("memory_search", toolArgs);
      if (result === null) return { success: true, data: { query: toolArgs.query, results: [], total: 0 } };
      return { success: true, data: result };
    },
  };
}
