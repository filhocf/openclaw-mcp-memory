import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";
export function createMemorySearchTool(config) {
    return {
        name: "memory_search",
        description: "Busca memórias por similaridade semântica (híbrida: texto + vetor). " +
            "Retorna resultados ranqueados por RRF (Reciprocal Rank Fusion).",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Texto para busca semântica",
                },
                limit: {
                    type: "integer",
                    default: config.maxResults,
                    description: "Número máximo de resultados (default: configurado no plugin)",
                },
                threshold: {
                    type: "number",
                    default: config.threshold,
                    description: "Score mínimo de relevância (0–1, default: configurado no plugin)",
                },
            },
            required: ["query"],
        },
        handler: async (args, ctx) => {
            const query = String(args.query);
            const limit = typeof args.limit === "number" ? Math.max(1, Math.floor(args.limit)) : config.maxResults;
            const threshold = typeof args.threshold === "number" ? args.threshold : config.threshold;
            const storage = getStorage();
            // Generate embedding for semantic search (best-effort)
            let queryEmbedding = null;
            try {
                queryEmbedding = await embed(query);
            }
            catch (err) {
                ctx.logger?.warn?.("[memory_search] embed failed, falling back to keyword-only:", err);
            }
            const results = storage.hybridSearch(query, queryEmbedding, limit, threshold);
            ctx.logger?.info?.(`[memory_search] query="${query.slice(0, 50)}..." results=${results.length} has_vector=${queryEmbedding !== null}`);
            return {
                query,
                results,
                total: results.length,
            };
        },
    };
}
//# sourceMappingURL=memory-search.js.map