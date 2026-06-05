/**
 * Thin HTTP client for mcp-memory-service (JSON-RPC 2.0 over HTTP).
 */

let _id = 0;

export class McpClient {
  constructor(private serviceUrl: string = "http://127.0.0.1:3202/mcp") {}

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(this.serviceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++_id, method: "tools/call", params: { name, arguments: args } }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const json = (await res.json()) as { result?: { content?: Array<{ text?: string }> } };
      const text = json?.result?.content?.[0]?.text;
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch(this.serviceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++_id, method: "initialize", params: {} }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }
}
