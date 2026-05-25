/**
 * Embedding generator using @xenova/transformers (all-MiniLM-L6-v2).
 *
 * Singleton pattern: lazy-init the pipeline on first call.
 */
type Logger = {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
};
/** Inject a logger (called once at plugin init). */
export declare function setEmbedLogger(logger: Logger): void;
/**
 * Embed a single text string into a Float32Array of 384 dimensions.
 * Returns null if the pipeline is unavailable.
 */
export declare function embed(text: string): Promise<Float32Array | null>;
/**
 * Attempt to "warm up" the embedding model so the first real call is fast.
 * Returns true if the pipeline initialized successfully.
 */
export declare function warmup(): Promise<boolean>;
/**
 * Check whether embeddings are available (pipeline initialized).
 */
export declare function isAvailable(): boolean;
export {};
//# sourceMappingURL=embeddings.d.ts.map