export declare const memoryForgetTool: {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            content_hash: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (_toolCallId: string, args: unknown) => Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
    }>;
};
//# sourceMappingURL=memory-forget.d.ts.map