import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";
import type { PluginConfig } from "../config.js";

export function createMemorySearchTool(config: PluginConfig) {
  return {
    name: "memory_search",
    description:
      "Busca memórias por similaridade semântica (híbrida: texto + vetor). " +
      "Retorna resultados ranqueados por RRF (Reciprocal Rank Fusion).",
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
      const query = String(p.query);
      const limit = typeof p.limit === "number" ? Math.max(1, Math.floor(p.limit)) : config.maxResults;
      const threshold = typeof p.threshold === "number" ? p.threshold : config.threshold;
      const storage = getStorage();

      let queryEmbedding: Float32Array | null = null;
      try { queryEmbedding = await embed(query); } catch { /* keyword-only fallback */ }

      const results = storage.hybridSearch(query, queryEmbedding, limit, threshold);
      return { success: true, data: { query, results, total: results.length } };
    },
  };
}
