import type { McpClient } from "../storage/mcp-client.js";
import type { FallbackStore } from "../storage/fallback.js";

export function createMemoryStoreTool(client: McpClient, fallback: FallbackStore) {
  return {
    name: "memory_store",
    description: "Armazena um fato, lição ou erro na memória persistente. Retorna o content_hash para referência futura.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Conteúdo/fato a armazenar" },
        tags: { type: "array", items: { type: "string" }, description: "Tags para categorização" },
        memory_type: { type: "string", enum: ["fact", "lesson", "mistake"], description: "Tipo de memória" },
        metadata: { type: "object", description: "Metadados adicionais (objeto JSON livre)" },
      },
      required: ["content"],
    },
    execute: async (_toolCallId: string, args: unknown) => {
      const p = args as Record<string, unknown>;
      const toolArgs = {
        content: String(p.content),
        metadata: {
          tags: Array.isArray(p.tags) ? p.tags.map(String).join(",") : "",
          type: typeof p.memory_type === "string" ? p.memory_type : "fact",
          ...(p.metadata && typeof p.metadata === "object" ? (p.metadata as Record<string, unknown>) : {}),
        },
      };
      const result = await client.callTool("memory_store", toolArgs);
      if (result === null) {
        await fallback.append("memory_store", toolArgs);
        return { success: true, data: { queued: true } };
      }
      return { success: true, data: result };
    },
  };
}
