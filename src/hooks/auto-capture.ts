import type { HookHandler } from "openclaw/plugin-sdk/hooks";

export const autoCaptureHandler: HookHandler<"after_tool_call"> = async (event, ctx) => {
  // TODO: extrair fatos da resposta e armazenar
  ctx.logger.info("[auto-capture] processing tool output for facts");
};
