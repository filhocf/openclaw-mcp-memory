import type { HookHandler } from "openclaw/plugin-sdk/hooks";

export const autoRecallHandler: HookHandler<"before_prompt_build"> = async (event, ctx) => {
  // TODO: buscar memórias relevantes e injetar no prompt
  ctx.logger.info("[auto-recall] checking memories for context");
};
