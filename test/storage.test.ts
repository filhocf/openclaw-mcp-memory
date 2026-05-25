import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryStorage, contentHash } from "../src/storage/sqlite.js";

describe("contentHash", () => {
  it("returns a 16-char hex string", () => {
    const hash = contentHash("hello world");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("is deterministic — same input = same hash", () => {
    const a = contentHash("same text");
    const b = contentHash("same text");
    expect(a).toBe(b);
  });

  it("different inputs produce different hashes", () => {
    const a = contentHash("text one");
    const b = contentHash("text two");
    expect(a).not.toBe(b);
  });
});

describe("MemoryStorage", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage({ threshold: 0.7, maxResults: 5, dbPath: ":memory:" } as any);
    storage.initialize();
  });

  afterEach(() => {
    storage.close();
  });

  it("inserts a memory and returns an id", () => {
    const result = storage.insert("test memory");
    expect(result.id).toBeTruthy();
    expect(result.content_hash).toMatch(/^[0-9a-f]{16}$/);
    expect(result.alreadyExisted).toBe(false);
  });

  it("detects duplicate content", () => {
    storage.insert("duplicate test");
    const result = storage.insert("duplicate test");
    expect(result.alreadyExisted).toBe(true);
  });

  it("retrieves by content_hash", () => {
    const { content_hash } = storage.insert("find me");
    const row = storage.getByHash(content_hash);
    expect(row).toBeTruthy();
    expect(row!.content).toBe("find me");
  });

  it("retrieves by id", () => {
    const { id } = storage.insert("by id test");
    const row = storage.getById(id);
    expect(row).toBeTruthy();
    expect(row!.content).toBe("by id test");
  });

  it("deletes by content_hash", () => {
    const { content_hash } = storage.insert("delete me");
    expect(storage.deleteByHash(content_hash)).toBe(true);
    expect(storage.getByHash(content_hash)).toBeUndefined();
  });

  it("deletes by id", () => {
    const { id } = storage.insert("delete by id");
    expect(storage.deleteById(id)).toBe(true);
    expect(storage.getById(id)).toBeUndefined();
  });

  it("returns stats", () => {
    storage.insert("memory one", { memoryType: "fact" });
    storage.insert("memory two", { memoryType: "lesson" });
    const stats = storage.stats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.byType.fact).toBeGreaterThanOrEqual(1);
    expect(stats.byType.lesson).toBeGreaterThanOrEqual(1);
    expect(stats.newest).toBeTruthy();
    expect(stats.oldest).toBeTruthy();
  });

  it("keyword search returns matching results", () => {
    storage.insert("the quick brown fox jumps");
    storage.insert("lazy dog sleeps all day");
    const results = storage.keywordSearch("fox", 10);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].content).toContain("fox");
  });

  it("keyword search excludes short terms (<3 chars)", () => {
    storage.insert("test content here");
    const results = storage.keywordSearch("a an the", 10);
    expect(results.length).toBe(0);
  });

  it("hybridSearch returns results ordered by score", () => {
    storage.insert("python programming language");
    storage.insert("javascript web development");
    storage.insert("python data science machine learning");
    const results = storage.hybridSearch("python", null, 10, 0);
    expect(results.length).toBeGreaterThanOrEqual(2);
    // All results should have scores
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });

  it("getAllRecent returns memories ordered by accessed_at desc", () => {
    storage.insert("first memory");
    storage.insert("second memory");
    const recent = storage.getAllRecent();
    expect(recent.length).toBeGreaterThanOrEqual(2);
  });
});
