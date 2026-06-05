import { describe, it, expect, afterEach } from "vitest";
import { FallbackStore } from "../src/storage/fallback.js";
import { unlink } from "fs/promises";

const TEST_PATH = "/tmp/openclaw-test-fallback-" + Date.now() + ".md";

afterEach(async () => {
  try { await unlink(TEST_PATH); } catch { /* ok */ }
});

describe("FallbackStore", () => {
  it("appends entries as JSON-lines", async () => {
    const store = new FallbackStore(TEST_PATH);
    await store.append("memory_store", { content: "first" });
    await store.append("memory_store", { content: "second" });
    const content = await store.read();
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).args.content).toBe("first");
    expect(JSON.parse(lines[1]).args.content).toBe("second");
  });

  it("drain returns items and clears file", async () => {
    const store = new FallbackStore(TEST_PATH);
    await store.append("memory_store", { content: "a" });
    await store.append("memory_delete", { content_hash: "xyz" });
    const items = await store.drain();
    expect(items).toHaveLength(2);
    expect(items[0].tool).toBe("memory_store");
    expect(items[1].tool).toBe("memory_delete");
    const remaining = await store.read();
    expect(remaining).toBe("");
  });

  it("drain on empty file returns empty array", async () => {
    const store = new FallbackStore(TEST_PATH);
    const items = await store.drain();
    expect(items).toEqual([]);
  });

  it("clear is idempotent", async () => {
    const store = new FallbackStore(TEST_PATH);
    await store.clear(); // no file
    await store.append("memory_store", { content: "x" });
    await store.clear();
    const content = await store.read();
    expect(content).toBe("");
  });
});
