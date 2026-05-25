import type { PluginConfig } from "../config.js";
export declare function createMemoryStoreTool(config: PluginConfig): {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            content: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            memory_type: {
                type: string;
                enum: string[];
                description: string;
            };
            metadata: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (_toolCallId: string, args: unknown) => Promise<{
        success: boolean;
        data: {
            id: string;
            content_hash: string;
            alreadyExisted: boolean;
        };
    }>;
};
//# sourceMappingURL=memory-store.d.ts.map