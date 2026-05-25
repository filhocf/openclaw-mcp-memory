/**
 * auto-recall hook
 *
 * Fires on before_prompt_build. Queries the most relevant memories
 * for the current conversation input and injects them as context
 * augmentation into the prompt via PluginHookBeforePromptBuildResult.
 */
import type { PluginConfig } from "../config.js";
interface BeforePromptBuildEvent {
    prompt: string;
    messages?: unknown[];
}
interface BeforePromptBuildResult {
    appendContext?: string;
    prependContext?: string;
    systemPrompt?: string;
}
interface RecallContext {
    logger: {
        info: (msg: string) => void;
        warn: (msg: string) => void;
    };
}
export declare function createAutoRecallHandler(config: PluginConfig): (event: BeforePromptBuildEvent, ctx: RecallContext) => Promise<BeforePromptBuildResult | undefined>;
export {};
//# sourceMappingURL=auto-recall.d.ts.map