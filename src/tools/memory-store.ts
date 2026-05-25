import type { Tool } from "openclaw/plugin-sdk/tool";
import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";
import type { PluginConfig } from "../config.js";

export function createMemoryStoreTool(config: PluginConfig): Tool {
  return {
    name: "memory_store",
    description: "Armazena um fato, lição ou erro na memória persistente. Retorna o content_hash para referência futura.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Conteúdo/fato a armazenar",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags para categorização (ex: ['python', 'workflow'])",
        },
        memory_type: {
          type: "string",
          enum: ["fact", "lesson", "mistake"],
          description: "Tipo de memória: fact (fato geral), lesson (lição aprendida), mistake (erro)",
        },
        metadata: {
          type: "object",
          description: "Metadados adicionais (objeto JSON livre)",
        },
      },
      required: ["content"],
    },
    handler: async (args, ctx) => {
      const content = String(args.content);
      const tags: string[] = Array.isArray(args.tags) ? args.tags.map(String) : [];
      const memoryType = typeof args.memory_type === "string" ? args.memory_type : "fact";
      const metadata: Record<string, unknown> =
        args.metadata && typeof args.metadata === "object" ? (args.metadata as Record<string, unknown>) : {};

      // Generate embedding (best-effort — might fail if model not loaded)
      let emb: Float32Array | null = null;
      try {
        emb = await embed(content);
      } catch (err) {
        ctx.logger?.warn?.("[memory_store] embed failed, storing without vector:", err);
      }

      const storage = getStorage();
      const result = storage.insert(content, {
        tags,
        memoryType,
        metadata,
        embedding: emb,
      });

      ctx.logger?.info?.(
        `[memory_store] stored "${content.slice(0, 60)}..." type=${memoryType} hash=${result.content_hash} existed=${result.alreadyExisted}`,
      );

      return {
        success: true,
        id: result.id,
        content_hash: result.content_hash,
        alreadyExisted: result.alreadyExisted,
      };
    },
  };
}
