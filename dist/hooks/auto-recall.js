/**
 * auto-recall hook
 *
 * Fires on before_prompt_build. Queries the most relevant memories
 * for the current conversation input and injects them as context
 * augmentation into the prompt via PluginHookBeforePromptBuildResult.
 */
import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";
export function createAutoRecallHandler(config) {
    const recallThreshold = config.threshold;
    const maxMemories = config.maxResults;
    return async (event, ctx) => {
        if (!config.autoRecall)
            return;
        const storage = getStorage();
        if (!storage)
            return;
        const inputText = event.prompt ?? "";
        if (inputText.trim().length < 10)
            return;
        const query = inputText.slice(0, 500);
        // Best-effort embedding for semantic search
        let queryEmbedding = null;
        try {
            queryEmbedding = await embed(query);
        }
        catch {
            // keyword-only fallback
        }
        const relevant = storage.hybridSearch(query, queryEmbedding, maxMemories, recallThreshold);
        if (relevant.length === 0) {
            ctx.logger.info("[auto-recall] no relevant memories found");
            return;
        }
        const memoryBlock = relevant
            .map((m, i) => `[Memory ${i + 1}] (${m.memory_type}) ${m.content}` +
            (m.tags.length > 0 ? ` [tags: ${m.tags.join(", ")}]` : ""))
            .join("\n\n");
        const contextText = `\n\n## Relevant Memories (auto-recalled)\n${memoryBlock}\n`;
        ctx.logger.info(`[auto-recall] injected ${relevant.length} memories (query: "${query.slice(0, 40)}...")`);
        // Return result — SDK appends to the prompt
        return { appendContext: contextText };
    };
}
//# sourceMappingURL=auto-recall.js.map