/**
 * auto-recall hook
 *
 * Fires on before_prompt_build. Queries the most relevant memories
 * for the current conversation input and injects them as context
 * augmentation into the prompt.
 */

import type { PluginConfig } from "../config.js";
import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";

export function createAutoRecallHandler(config: PluginConfig) {
  const recallThreshold = config.threshold;
  const maxMemories = config.maxResults;

  return async (event: any, ctx: { logger?: { info?: (msg: string) => void; warn?: (msg: string) => void } }) => {
    if (!config.autoRecall) return;

    const storage = getStorage();
    if (!storage) return;

    // Extract input text from the event — attempt several common shapes
    const inputText =
      event?.input ??
      event?.text ??
      event?.prompt ??
      event?.message?.content ??
      "";

    if (!inputText || String(inputText).trim().length < 10) {
      return; // Not enough context to search
    }

    const query = String(inputText).slice(0, 500);

    // Generate embedding for semantic search (best-effort)
    let queryEmbedding: Float32Array | null = null;
    try {
      queryEmbedding = await embed(query);
    } catch {
      // silently fall back to keyword-only
    }

    const relevant = storage.hybridSearch(query, queryEmbedding, maxMemories, recallThreshold);

    if (relevant.length === 0) {
      ctx.logger?.info?.("[auto-recall] no relevant memories found");
      return;
    }

    // Build a compact context snippet
    const memoryBlock = relevant
      .map(
        (m, i) =>
          `[Memory ${i + 1}] (${m.memory_type}) ${m.content}` +
          (m.tags.length > 0 ? ` [tags: ${m.tags.join(", ")}]` : ""),
      )
      .join("\n\n");

    // Inject into the prompt context
    const contextText = `\n\n## Relevant Memories (auto-recalled)\n${memoryBlock}\n`;

    // The SDK injects via event augmentation — try several injection points
    if (event?.context) {
      // Typical pattern: event.context holds mutable prompt context
      if (Array.isArray(event.context)) {
        event.context.push({ role: "system", content: contextText });
      } else if (typeof event.context === "object") {
        event.context.memories = contextText;
      }
    } else if (event?.promptBuilder) {
      event.promptBuilder?.addSupplement?.(contextText);
    } else if (event?.addContext) {
      event.addContext(contextText);
    }

    ctx.logger?.info?.(
      `[auto-recall] injected ${relevant.length} memories (query: "${query.slice(0, 40)}...")`,
    );
  };
}
