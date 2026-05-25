import Database from "better-sqlite3";
import { PluginConfig } from "../config.js";
export interface MemoryRow {
    id: string;
    content_hash: string;
    content: string;
    tags: string;
    memory_type: string;
    metadata: string;
    embedding: Buffer | null;
    created_at: string;
    accessed_at: string;
}
export interface SearchResult {
    id: string;
    content_hash: string;
    content: string;
    tags: string[];
    memory_type: string;
    metadata: Record<string, unknown>;
    score: number;
    created_at: string;
}
export declare function contentHash(content: string): string;
export declare function getStorage(): MemoryStorage;
export declare function initStorage(config: PluginConfig): MemoryStorage;
export declare function destroyStorage(): void;
export declare class MemoryStorage {
    private db;
    private config;
    constructor(config: PluginConfig);
    initialize(): void;
    /** Expose the underlying Database for GraphStore (same connection, same WAL). */
    get rawDb(): Database.Database;
    close(): void;
    insert(content: string, opts?: {
        tags?: string[];
        memoryType?: string;
        metadata?: Record<string, unknown>;
        embedding?: Float32Array | null;
    }): {
        id: string;
        content_hash: string;
        alreadyExisted: boolean;
    };
    getByHash(hash: string): MemoryRow | undefined;
    getById(id: string): MemoryRow | undefined;
    /**
     * BM25-like keyword search (simple term-frequency scoring).
     * Returns rows with a numeric score (higher = better match).
     */
    keywordSearch(query: string, limit: number): SearchResult[];
    /**
     * Vector similarity search via cosine similarity on stored embeddings.
     * Returns rows with a 0–1 score.
     */
    vectorSearch(embedding: Float32Array, limit: number): SearchResult[];
    /**
     * Hybrid search: RRF (Reciprocal Rank Fusion) over keyword + vector results.
     */
    hybridSearch(query: string, embedding: Float32Array | null, limit: number, threshold: number): SearchResult[];
    deleteByHash(hash: string): boolean;
    deleteById(id: string): boolean;
    stats(): {
        total: number;
        byType: Record<string, number>;
        recentCount: number;
        oldest: string | null;
        newest: string | null;
    };
    /**
     * Retrieve all memories — used by hooks.
     */
    getAllRecent(): MemoryRow[];
}
//# sourceMappingURL=sqlite.d.ts.map