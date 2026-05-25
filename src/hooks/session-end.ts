import type { HookHandler } from "openclaw/plugin-sdk/hooks";

export const sessionEndHandler: HookHandler<"stop"> = async (event, ctx) => {
  // TODO: consolidar memórias da sessão (dedup, stale, dream)
  ctx.logger.info("[session-end] consolidating session memories");
};
