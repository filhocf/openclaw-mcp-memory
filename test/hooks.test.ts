import { describe, it, expect, vi } from "vitest";
import { createAutoRecallHandler } from "../src/hooks/auto-recall.js";
import { createAutoCaptureHandler } from "../src/hooks/auto-capture.js";
import { createSessionEndHandler } from "../src/hooks/session-end.js";
import { DEFAULT_CONFIG } from "../src/config.js";
import type { McpClient } from "../src/storage/mcp-client.js";
import type { FallbackStore } from "../src/storage/fallback.js";

function mockClient(result: unknown = null): McpClient {
  return { callTool: vi.fn().mockResolvedValue(result), isAvailable: vi.fn().mockResolvedValue(true) } as any;
}

function mockFallback(): FallbackStore {
  return { append: vi.fn().mockResolvedValue(undefined), read: vi.fn(), drain: vi.fn(), clear: vi.fn() } as any;
}

const ctx = { logger: { info: vi.fn(), warn: vi.fn() } };

describe("auto-recall hook", () => {
  it("injects memories when available", async () => {
    const client = mockClient({ memories: [{ content: "remember this", memory_type: "fact", tags: ["test"] }] });
    const handler = createAutoRecallHandler(DEFAULT_CONFIG, client);
    const result = await handler({ prompt: "What did we decide about the database?" }, ctx);
    expect(result?.appendContext).toContain("remember this");
    expect(result?.appendContext).toContain("Relevant Memories");
  });

  it("returns undefined when prompt is too short", async () => {
    const client = mockClient();
    const handler = createAutoRecallHandler(DEFAULT_CONFIG, client);
    const result = await handler({ prompt: "hi" }, ctx);
    expect(result).toBeUndefined();
  });

  it("returns undefined when autoRecall is disabled", async () => {
    const client = mockClient();
    const handler = createAutoRecallHandler({ ...DEFAULT_CONFIG, autoRecall: false }, client);
    const result = await handler({ prompt: "What about the database migration?" }, ctx);
    expect(result).toBeUndefined();
  });

  it("returns undefined when service returns null", async () => {
    const client = mockClient(null);
    const handler = createAutoRecallHandler(DEFAULT_CONFIG, client);
    const result = await handler({ prompt: "What about the database migration?" }, ctx);
    expect(result).toBeUndefined();
  });
});

describe("auto-capture hook", () => {
  it("stores tool result as memory", async () => {
    const client = mockClient({ stored: true });
    const fb = mockFallback();
    const handler = createAutoCaptureHandler(DEFAULT_CONFIG, client, fb);
    await handler({ name: "file_read", result: "This is a long enough content to be captured by auto-capture" }, ctx as any);
    expect(client.callTool).toHaveBeenCalledWith("memory_store", expect.objectContaining({ content: expect.any(String) }));
  });

  it("skips memory_* tools", async () => {
    const client = mockClient();
    const fb = mockFallback();
    const handler = createAutoCaptureHandler(DEFAULT_CONFIG, client, fb);
    await handler({ name: "memory_search", result: "something long enough to capture" }, ctx as any);
    expect(client.callTool).not.toHaveBeenCalled();
  });

  it("falls back when client returns null", async () => {
    const client = mockClient(null);
    const fb = mockFallback();
    const handler = createAutoCaptureHandler(DEFAULT_CONFIG, client, fb);
    await handler({ name: "web_search", result: "This is content that is long enough for capture" }, ctx as any);
    expect(fb.append).toHaveBeenCalled();
  });

  it("skips when autoCapture is disabled", async () => {
    const client = mockClient();
    const fb = mockFallback();
    const handler = createAutoCaptureHandler({ ...DEFAULT_CONFIG, autoCapture: false }, client, fb);
    await handler({ name: "file_read", result: "some long result content here" }, ctx as any);
    expect(client.callTool).not.toHaveBeenCalled();
  });
});

describe("session-end hook", () => {
  it("calls memory_health", async () => {
    const client = mockClient({ total: 10 });
    const handler = createSessionEndHandler(client);
    await handler();
    expect(client.callTool).toHaveBeenCalledWith("memory_health", {});
  });
});
