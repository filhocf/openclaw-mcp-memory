/**
 * auto-capture hook
 *
 * Fires on after_tool_call. Extracts facts from tool responses and
 * stores them automatically as memory entries.
 */
import type { PluginConfig } from "../config.js";
interface ToolCallEvent {
    name?: string;
    toolName?: string;
    arguments?: Record<string, unknown>;
    args?: Record<string, unknown>;
    result?: unknown;
    output?: unknown;
    response?: unknown;
    id?: string;
}
export declare function createAutoCaptureHandler(config: PluginConfig): (event: ToolCallEvent, ctx: {
    logger?: {
        info?: (msg: string) => void;
        warn?: (msg: string) => void;
    };
}) => Promise<void>;
export {};
//# sourceMappingURL=auto-capture.d.ts.map