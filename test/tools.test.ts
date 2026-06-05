import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryStoreTool } from "../src/tools/memory-store.js";
import { createMemorySearchTool } from "../src/tools/memory-search.js";
import { createMemoryForgetTool } from "../src/tools/memory-forget.js";
import { createMemoryStatsTool } from "../src/tools/memory-stats.js";
import type { McpClient } from "../src/storage/mcp-client.js";
import type { FallbackStore } from "../src/storage/fallback.js";
import { DEFAULT_CONFIG } from "../src/config.js";

function mockClient(result: unknown = { status: "ok" }): McpClient {
  return { callTool: vi.fn().mockResolvedValue(result), isAvailable: vi.fn().mockResolvedValue(true) } as any;
}

function mockFallback(): FallbackStore {
  return { append: vi.fn().mockResolvedValue(undefined), read: vi.fn(), drain: vi.fn(), clear: vi.fn() } as any;
}

describe("memory_store tool", () => {
  it("stores via client and returns data", async () => {
    const client = mockClient({ content_hash: "abc123" });
    const fb = mockFallback();
    const tool = createMemoryStoreTool(client, fb);
    const res = await tool.execute("call1", { content: "test fact", tags: ["a"], memory_type: "fact" });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ content_hash: "abc123" });
    expect(client.callTool).toHaveBeenCalledWith("memory_store", expect.objectContaining({ content: "test fact" }));
  });

  it("falls back when client returns null", async () => {
    const client = mockClient(null);
    const fb = mockFallback();
    const tool = createMemoryStoreTool(client, fb);
    const res = await tool.execute("call2", { content: "offline" });
    expect(res.data).toEqual({ queued: true });
    expect(fb.append).toHaveBeenCalled();
  });
});

describe("memory_search tool", () => {
  it("returns search results", async () => {
    const client = mockClient({ memories: [{ content: "found" }], total: 1 });
    const tool = createMemorySearchTool(client, DEFAULT_CONFIG);
    const res = await tool.execute("call3", { query: "find something" });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ memories: [{ content: "found" }], total: 1 });
  });

  it("returns empty on service failure", async () => {
    const client = mockClient(null);
    const tool = createMemorySearchTool(client, DEFAULT_CONFIG);
    const res = await tool.execute("call4", { query: "no service" });
    expect(res.data).toEqual({ query: "no service", results: [], total: 0 });
  });
});

describe("memory_forget tool", () => {
  it("deletes via client", async () => {
    const client = mockClient({ deleted: true });
    const fb = mockFallback();
    const tool = createMemoryForgetTool(client, fb);
    const res = await tool.execute("call5", { content_hash: "abc123" });
    expect(res.success).toBe(true);
    expect(client.callTool).toHaveBeenCalledWith("memory_delete", { content_hash: "abc123" });
  });

  it("queues to fallback when offline", async () => {
    const client = mockClient(null);
    const fb = mockFallback();
    const tool = createMemoryForgetTool(client, fb);
    const res = await tool.execute("call6", { content_hash: "abc123" });
    expect(res.data).toEqual({ queued: true });
    expect(fb.append).toHaveBeenCalledWith("memory_delete", { content_hash: "abc123" });
  });
});

describe("memory_stats tool", () => {
  it("returns stats from service", async () => {
    const client = mockClient({ total: 42, types: { fact: 30, lesson: 12 } });
    const tool = createMemoryStatsTool(client);
    const res = await tool.execute("call7", {});
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ total: 42, types: { fact: 30, lesson: 12 } });
  });

  it("returns error on service failure", async () => {
    const client = mockClient(null);
    const tool = createMemoryStatsTool(client);
    const res = await tool.execute("call8", {});
    expect(res.success).toBe(false);
    expect(res.data).toEqual({ error: "service unavailable" });
  });
});
