/**
 * Embedding generator using @xenova/transformers (all-MiniLM-L6-v2).
 *
 * Singleton pattern: lazy-init the pipeline on first call.
 */
import { env, pipeline } from "@xenova/transformers";
// Suppress the on-disk model cache noise in plugin logs
env.localModelPath = env.localModelPath ?? "./.models";
let _pipeline = null;
let _logger = null;
const MODEL = "Xenova/all-MiniLM-L6-v2";
/** Inject a logger (called once at plugin init). */
export function setEmbedLogger(logger) {
    _logger = logger;
}
/**
 * Get or lazy-init the embedding pipeline.
 * Returns false if pipeline initialization fails (e.g., model unavailable).
 */
async function getPipeline() {
    if (_pipeline)
        return _pipeline;
    try {
        _pipeline = (await pipeline("feature-extraction", MODEL));
        return _pipeline;
    }
    catch (err) {
        _logger?.error(`[embeddings] failed to init pipeline: ${err}`);
        return null;
    }
}
/**
 * Embed a single text string into a Float32Array of 384 dimensions.
 * Returns null if the pipeline is unavailable.
 */
export async function embed(text) {
    const pipe = await getPipeline();
    if (!pipe)
        return null;
    try {
        const output = await pipe(text, { pooling: "mean", normalize: true });
        return new Float32Array(output.data);
    }
    catch (err) {
        _logger?.error(`[embeddings] embed failed: ${err}`);
        return null;
    }
}
/**
 * Attempt to "warm up" the embedding model so the first real call is fast.
 * Returns true if the pipeline initialized successfully.
 */
export async function warmup() {
    const pipe = await getPipeline();
    if (!pipe)
        return false;
    // Run a tiny dummy to pre-load weights
    try {
        await pipe("test", { pooling: "mean", normalize: true });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check whether embeddings are available (pipeline initialized).
 */
export function isAvailable() {
    return _pipeline !== null;
}
//# sourceMappingURL=embeddings.js.map