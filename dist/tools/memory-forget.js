import { getStorage } from "../storage/sqlite.js";
export const memoryForgetTool = {
    name: "memory_forget",
    description: "Remove uma memória específica pelo content_hash (retornado por memory_store) ou pelo id interno.",
    parameters: {
        type: "object",
        properties: {
            content_hash: {
                type: "string",
                description: "Hash SHA-256 da memória a remover (16 chars hex). Retornado por memory_store.",
            },
            id: {
                type: "string",
                description: "UUID interno da memória a remover (alternativa ao content_hash).",
            },
        },
        oneOf: [{ required: ["content_hash"] }, { required: ["id"] }],
    },
    handler: async (args, ctx) => {
        const storage = getStorage();
        const hash = args.content_hash ? String(args.content_hash) : null;
        const id = args.id ? String(args.id) : null;
        let deleted = false;
        if (hash) {
            deleted = storage.deleteByHash(hash);
            ctx.logger?.info?.(`[memory_forget] by hash=${hash} found=${deleted}`);
        }
        else if (id) {
            deleted = storage.deleteById(id);
            ctx.logger?.info?.(`[memory_forget] by id=${id} found=${deleted}`);
        }
        return {
            success: deleted,
            message: deleted ? "Memória removida." : "Memória não encontrada.",
        };
    },
};
//# sourceMappingURL=memory-forget.js.map