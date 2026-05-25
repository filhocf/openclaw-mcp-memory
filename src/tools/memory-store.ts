import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";
import type { PluginConfig } from "../config.js";

export function createMemoryStoreTool(config: PluginConfig) {
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
    execute: async (_toolCallId: string, args: unknown) => {
      const p = args as Record<string, unknown>;
      const content = String(p.content);
      const tags: string[] = Array.isArray(p.tags) ? p.tags.map(String) : [];
      const memoryType = typeof p.memory_type === "string" ? p.memory_type : "fact";
      const metadata: Record<string, unknown> =
        p.metadata && typeof p.metadata === "object" ? (p.metadata as Record<string, unknown>) : {};

      let emb: Float32Array | null = null;
      try { emb = await embed(content); } catch { /* store without vector */ }

      const storage = getStorage();
      const result = storage.insert(content, { tags, memoryType, metadata, embedding: emb });

      return { success: true, data: { id: result.id, content_hash: result.content_hash, alreadyExisted: result.alreadyExisted } };
    },
  };
}
