import { getStorage } from "../storage/sqlite.js";
let _graphStore;
export function setStatsGraphStore(gs) {
    _graphStore = gs;
}
export function createMemoryStatsTool(graphStore) {
    _graphStore = graphStore;
    return {
        name: "memory_stats",
        description: "Retorna estatísticas da memória: total, por tipo, recentes, e (se ativo) do grafo de conhecimento.",
        parameters: { type: "object", properties: {} },
        execute: async () => {
            const storage = getStorage();
            const stats = storage.stats();
            const graphStats = _graphStore ? _graphStore.stats() : undefined;
            return { success: true, data: { ...stats, graph: graphStats } };
        },
    };
}
//# sourceMappingURL=memory-stats.js.map