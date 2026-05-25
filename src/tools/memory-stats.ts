import type { Tool } from "openclaw/plugin-sdk/tool";
import { getStorage } from "../storage/sqlite.js";
import type { GraphStore } from "../storage/graph.js";

export function createMemoryStatsTool(graphStore?: GraphStore): Tool {
  return {
    name: "memory_stats",
    description:
      "Retorna estatísticas da memória: total de registros, distribuição por tipo, " +
      "registros recentes (7 dias), e estatísticas do knowledge graph (se habilitado).",
    parameters: {
      type: "object",
      properties: {},
    },
    handler: async (_args, ctx) => {
      const storage = getStorage();
      const memStats = storage.stats();

      let graphStats = null;
      if (graphStore) {
        try {
          graphStats = graphStore.stats();
        } catch (err) {
          ctx.logger?.warn?.("[memory_stats] graph stats unavailable:", err);
        }
      }

      ctx.logger?.info?.(
        `[memory_stats] total=${memStats.total} types=${Object.keys(memStats.byType).length}`,
      );

      return {
        memories: memStats,
        graph: graphStats,
      };
    },
  };
}
