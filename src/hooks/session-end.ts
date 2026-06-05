import type { McpClient } from "../storage/mcp-client.js";

export function createSessionEndHandler(client: McpClient) {
  return async () => {
    const result = await client.callTool("memory_health", {});
    if (result) {
      // eslint-disable-next-line no-console
      console.log("[session-end] memory service stats:", JSON.stringify(result));
    }
  };
}
