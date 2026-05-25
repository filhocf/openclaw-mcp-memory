import type { PluginConfig } from "../config.js";
export declare function createMemorySearchTool(config: PluginConfig): {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                default: number;
                description: string;
            };
            threshold: {
                type: string;
                default: number;
                description: string;
            };
        };
        required: string[];
    };
    execute: (_toolCallId: string, args: unknown) => Promise<{
        success: boolean;
        data: {
            query: string;
            results: import("../storage/sqlite.js").SearchResult[];
            total: number;
        };
    }>;
};
//# sourceMappingURL=memory-search.d.ts.map