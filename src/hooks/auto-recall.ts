import type { PluginConfig } from "../config.js";
import type { McpClient } from "../storage/mcp-client.js";

interface BeforePromptBuildEvent {
  prompt: string;
}
interface BeforePromptBuildResult {
  appendContext?: string;
}

export function createAutoRecallHandler(config: PluginConfig, client: McpClient) {
  return async (event: BeforePromptBuildEvent, ctx: { logger: { info: (msg: string) => void } }): Promise<BeforePromptBuildResult | undefined> => {
    if (!config.autoRecall) return;
    const query = (event.prompt ?? "").slice(0, 500).trim();
    if (query.length < 10) return;

    const result = await client.callTool("memory_search", { query, limit: config.maxResults });
    if (result === null || !Array.isArray((result as any)?.memories)) return;

    const memories = (result as any).memories as Array<{ content: string; memory_type?: string; tags?: string[] }>;
    if (memories.length === 0) return;

    const block = memories
      .map((m, i) => `[Memory ${i + 1}] (${m.memory_type ?? "fact"}) ${m.content}` + (m.tags?.length ? ` [tags: ${m.tags.join(", ")}]` : ""))
      .join("\n\n");

    ctx.logger.info(`[auto-recall] injected ${memories.length} memories`);
    return { appendContext: `\n\n## Relevant Memories (auto-recalled)\n${block}\n` };
  };
}
