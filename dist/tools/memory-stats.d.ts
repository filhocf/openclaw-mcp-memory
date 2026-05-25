import type { GraphStore } from "../storage/graph.js";
export declare function setStatsGraphStore(gs: GraphStore | undefined): void;
export declare function createMemoryStatsTool(graphStore?: GraphStore): {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {};
    };
    execute: () => Promise<{
        success: boolean;
        data: {
            graph: import("../storage/graph.js").GraphStats | undefined;
            total: number;
            byType: Record<string, number>;
            recentCount: number;
            oldest: string | null;
            newest: string | null;
        };
    }>;
};
//# sourceMappingURL=memory-stats.d.ts.map