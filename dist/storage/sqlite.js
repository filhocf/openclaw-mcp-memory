import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------
export function contentHash(content) {
    return createHash("sha256").update(content, "utf-8").digest("hex").slice(0, 16);
}
// ---------------------------------------------------------------------------
// MemoryStorage — singleton / shared instance
// ---------------------------------------------------------------------------
let _instance = null;
export function getStorage() {
    if (!_instance)
        throw new Error("MemoryStorage not initialized — register plugin first");
    return _instance;
}
export function initStorage(config) {
    if (!_instance) {
        _instance = new MemoryStorage(config);
        _instance.initialize();
    }
    return _instance;
}
export function destroyStorage() {
    if (_instance) {
        _instance.close();
        _instance = null;
    }
}
// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------
export class MemoryStorage {
    db;
    config;
    constructor(config) {
        this.config = config;
        const dbPath = config.dbPath ?? "./mcp-memory.db";
        this.db = new Database(dbPath);
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("foreign_keys = ON");
    }
    initialize() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id            TEXT PRIMARY KEY,
        content_hash  TEXT NOT NULL UNIQUE,
        content       TEXT NOT NULL,
        tags          TEXT NOT NULL DEFAULT '[]',
        memory_type   TEXT NOT NULL DEFAULT 'fact',
        metadata      TEXT NOT NULL DEFAULT '{}',
        embedding     BLOB,
        created_at    TEXT NOT NULL DEFAULT (datetime('now')),
        accessed_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_memories_content_hash ON memories(content_hash);
      CREATE INDEX IF NOT EXISTS idx_memories_memory_type ON memories(memory_type);
      CREATE INDEX IF NOT EXISTS idx_memories_created_at  ON memories(created_at);
    `);
    }
    /** Expose the underlying Database for GraphStore (same connection, same WAL). */
    get rawDb() {
        return this.db;
    }
    close() {
        this.db.close();
    }
    // -----------------------------------------------------------------------
    // CRUD
    // -----------------------------------------------------------------------
    insert(content, opts = {}) {
        const hash = contentHash(content);
        const existing = this.db
            .prepare("SELECT id FROM memories WHERE content_hash = ?")
            .get(hash);
        if (existing) {
            // Touch accessed_at, return existing
            this.db.prepare("UPDATE memories SET accessed_at = datetime('now') WHERE content_hash = ?").run(hash);
            return { id: existing.id, content_hash: hash, alreadyExisted: true };
        }
        const id = randomUUID();
        const tags = JSON.stringify(opts.tags ?? []);
        const mType = opts.memoryType ?? "fact";
        const meta = JSON.stringify(opts.metadata ?? {});
        const emb = opts.embedding ? Buffer.from(opts.embedding.buffer) : null;
        this.db
            .prepare(`INSERT INTO memories (id, content_hash, content, tags, memory_type, metadata, embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(id, hash, content, tags, mType, meta, emb);
        return { id, content_hash: hash, alreadyExisted: false };
    }
    getByHash(hash) {
        return this.db.prepare("SELECT * FROM memories WHERE content_hash = ?").get(hash);
    }
    getById(id) {
        return this.db.prepare("SELECT * FROM memories WHERE id = ?").get(id);
    }
    // -----------------------------------------------------------------------
    // Search
    // -----------------------------------------------------------------------
    /**
     * BM25-like keyword search (simple term-frequency scoring).
     * Returns rows with a numeric score (higher = better match).
     */
    keywordSearch(query, limit) {
        const terms = query
            .toLowerCase()
            .split(/\s+/)
            .filter((t) => t.length > 2);
        if (terms.length === 0)
            return [];
        // Build a set of LIKE conditions
        const likeClauses = terms.map(() => "(LOWER(content) LIKE ?)");
        const likeParams = terms.map((t) => `%${t}%`);
        // Score: count how many terms matched (simple)
        const scoreExpr = terms.map(() => `CASE WHEN LOWER(content) LIKE ? THEN 1 ELSE 0 END`).join(" + ");
        const scoreParams = [];
        for (const t of terms) {
            scoreParams.push(`%${t}%`);
        }
        const sql = `
      SELECT id, content_hash, content, tags, memory_type, metadata, created_at,
             (${scoreExpr}) AS score
      FROM memories
      WHERE ${likeClauses.join(" OR ")}
      ORDER BY score DESC, accessed_at DESC
      LIMIT ?
    `;
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...scoreParams, ...likeParams, limit);
        return rows.map((r) => ({
            id: r.id,
            content_hash: r.content_hash,
            content: r.content,
            tags: safeJsonParse(r.tags, []),
            memory_type: r.memory_type,
            metadata: safeJsonParse(r.metadata, {}),
            score: r.score,
            created_at: r.created_at,
        }));
    }
    /**
     * Vector similarity search via cosine similarity on stored embeddings.
     * Returns rows with a 0–1 score.
     */
    vectorSearch(embedding, limit) {
        // Load all rows that have embeddings
        const rows = this.db.prepare("SELECT * FROM memories WHERE embedding IS NOT NULL").all();
        if (rows.length === 0)
            return [];
        const scored = [];
        for (const row of rows) {
            if (!row.embedding)
                continue;
            const stored = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4);
            const sim = cosineSimilarity(embedding, stored);
            if (sim > 0) {
                scored.push({ row, score: sim });
            }
        }
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, limit);
        return top.map((s) => ({
            id: s.row.id,
            content_hash: s.row.content_hash,
            content: s.row.content,
            tags: safeJsonParse(s.row.tags, []),
            memory_type: s.row.memory_type,
            metadata: safeJsonParse(s.row.metadata, {}),
            score: s.score,
            created_at: s.row.created_at,
        }));
    }
    /**
     * Hybrid search: RRF (Reciprocal Rank Fusion) over keyword + vector results.
     */
    hybridSearch(query, embedding, limit, threshold) {
        const kwLimit = limit * 3;
        const kwResults = this.keywordSearch(query, kwLimit);
        let vecResults = [];
        if (embedding) {
            vecResults = this.vectorSearch(embedding, kwLimit);
        }
        // RRF fusion
        const rrfK = 60;
        const scoreMap = new Map();
        // Keyword ranks
        for (let i = 0; i < kwResults.length; i++) {
            const r = kwResults[i];
            const rank = i + 1;
            const rrfScore = 1 / (rrfK + rank);
            scoreMap.set(r.content_hash, { result: r, rrfScore });
        }
        // Vector ranks
        for (let i = 0; i < vecResults.length; i++) {
            const r = vecResults[i];
            const rank = i + 1;
            const rrfScore = 1 / (rrfK + rank);
            const existing = scoreMap.get(r.content_hash);
            if (existing) {
                existing.rrfScore += rrfScore;
            }
            else {
                scoreMap.set(r.content_hash, { result: r, rrfScore });
            }
        }
        const ranked = Array.from(scoreMap.values())
            .sort((a, b) => b.rrfScore - a.rrfScore)
            .slice(0, limit);
        // Normalize rrfScore to 0–1 for the score field
        const maxRrf = ranked.length > 0 ? ranked[0].rrfScore : 1;
        return ranked.map((entry) => ({
            ...entry.result,
            score: maxRrf > 0 ? entry.rrfScore / maxRrf : 0,
        })).filter((r) => r.score >= threshold);
    }
    // -----------------------------------------------------------------------
    // Forget
    // -----------------------------------------------------------------------
    deleteByHash(hash) {
        const result = this.db.prepare("DELETE FROM memories WHERE content_hash = ?").run(hash);
        return result.changes > 0;
    }
    deleteById(id) {
        const result = this.db.prepare("DELETE FROM memories WHERE id = ?").run(id);
        return result.changes > 0;
    }
    // -----------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------
    stats() {
        const total = this.db.prepare("SELECT COUNT(*) AS c FROM memories").get().c;
        const byTypeRows = this.db.prepare("SELECT memory_type, COUNT(*) AS c FROM memories GROUP BY memory_type").all();
        const byType = {};
        for (const r of byTypeRows)
            byType[r.memory_type] = r.c;
        const recentCount = this.db.prepare("SELECT COUNT(*) AS c FROM memories WHERE created_at >= datetime('now', '-7 days')").get().c;
        const oldest = this.db.prepare("SELECT MIN(created_at) AS v FROM memories").get().v;
        const newest = this.db.prepare("SELECT MAX(created_at) AS v FROM memories").get().v;
        return { total, byType, recentCount, oldest, newest };
    }
    /**
     * Retrieve all memories — used by hooks.
     */
    getAllRecent() {
        return this.db.prepare("SELECT * FROM memories ORDER BY accessed_at DESC LIMIT 50").all();
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}
function safeJsonParse(raw, fallback) {
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=sqlite.js.map