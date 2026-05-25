/**
 * auto-capture hook
 *
 * Fires on after_tool_call. Extracts facts from tool responses and
 * stores them automatically as memory entries.
 */
import { getStorage } from "../storage/sqlite.js";
import { embed } from "../storage/embeddings.js";
export function createAutoCaptureHandler(config) {
    return async (event, ctx) => {
        if (!config.autoCapture)
            return;
        const storage = getStorage();
        if (!storage)
            return;
        const toolName = event?.name ?? event?.toolName ?? "";
        const toolArgs = event?.arguments ?? event?.args ?? {};
        const toolResult = event?.result ?? event?.output ?? event?.response;
        if (!toolName)
            return;
        // Don't re-capture our own memory tools
        if (toolName.startsWith("memory_"))
            return;
        // Extract fact-worthy content from the result
        const facts = extractFacts(toolName, toolArgs, toolResult);
        if (facts.length === 0) {
            return;
        }
        for (const fact of facts) {
            // Generate embedding
            let emb = null;
            try {
                emb = await embed(fact.content);
            }
            catch {
                // store without vector
            }
            const result = storage.insert(fact.content, {
                tags: fact.tags,
                memoryType: "fact",
                metadata: { sourceTool: toolName, ...fact.metadata },
                embedding: emb,
            });
            ctx.logger?.info?.(`[auto-capture] stored from "${toolName}": "${fact.content.slice(0, 50)}..." hash=${result.content_hash} existed=${result.alreadyExisted}`);
        }
    };
}
function extractFacts(toolName, args, result) {
    const facts = [];
    // 1. If result is a string, extract meaningful sentences
    if (typeof result === "string" && result.length > 20) {
        const sentences = result
            .split(/[.!?\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 30 && s.length < 500);
        for (const sentence of sentences.slice(0, 3)) {
            facts.push({
                content: sentence,
                tags: [toolName],
                metadata: {},
            });
        }
        return facts;
    }
    // 2. If result is a JSON object, stringify key/value pairs
    if (result && typeof result === "object") {
        const obj = result;
        // Try to find a "result" or "output" or "content" field
        const contentFields = ["result", "output", "content", "response", "text", "answer", "summary"];
        for (const field of contentFields) {
            if (typeof obj[field] === "string" && String(obj[field]).length > 20) {
                const text = String(obj[field]);
                facts.push({
                    content: text.slice(0, 300),
                    tags: [toolName, ...(args.query ? ["query"] : [])],
                    metadata: {},
                });
                break;
            }
        }
        // If result has explicit key-value structure, capture that too
        if (Object.keys(obj).length > 0 && facts.length === 0) {
            const summary = Object.entries(obj)
                .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")
                .slice(0, 5)
                .map(([k, v]) => `${k}: ${v}`)
                .join("; ");
            if (summary.length > 20) {
                facts.push({
                    content: `${toolName} result — ${summary}`,
                    tags: [toolName],
                    metadata: {},
                });
            }
        }
    }
    return facts;
}
//# sourceMappingURL=auto-capture.js.map