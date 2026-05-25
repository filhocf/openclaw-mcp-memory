/**
 * Embedding generator using @xenova/transformers (all-MiniLM-L6-v2).
 *
 * Singleton pattern: lazy-init the pipeline on first call.
 */

import { env, pipeline, type PipelineType } from "@xenova/transformers";

// Suppress the on-disk model cache noise in plugin logs
env.localModelPath = env.localModelPath ?? "./.models";

type FeatureExtractionPipeline = (
  texts: string | string[],
  options?: { pooling?: string; normalize?: boolean },
) => Promise<{ data: Float32Array; dims: number[] }>;

type Logger = { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void };

let _pipeline: FeatureExtractionPipeline | null = null;
let _logger: Logger | null = null;

const MODEL = "Xenova/all-MiniLM-L6-v2";

/** Inject a logger (called once at plugin init). */
export function setEmbedLogger(logger: Logger): void {
  _logger = logger;
}

/**
 * Get or lazy-init the embedding pipeline.
 * Returns false if pipeline initialization fails (e.g., model unavailable).
 */
async function getPipeline(): Promise<FeatureExtractionPipeline | null> {
  if (_pipeline) return _pipeline;
  try {
    _pipeline = (await pipeline(
      "feature-extraction" as PipelineType,
      MODEL,
    )) as unknown as FeatureExtractionPipeline;
    return _pipeline;
  } catch (err) {
    _logger?.error(`[embeddings] failed to init pipeline: ${err}`);
    return null;
  }
}

/**
 * Embed a single text string into a Float32Array of 384 dimensions.
 * Returns null if the pipeline is unavailable.
 */
export async function embed(text: string): Promise<Float32Array | null> {
  const pipe = await getPipeline();
  if (!pipe) return null;
  try {
    const output = await pipe(text, { pooling: "mean", normalize: true });
    return new Float32Array(output.data);
  } catch (err) {
    _logger?.error(`[embeddings] embed failed: ${err}`);
    return null;
  }
}

/**
 * Attempt to "warm up" the embedding model so the first real call is fast.
 * Returns true if the pipeline initialized successfully.
 */
export async function warmup(): Promise<boolean> {
  const pipe = await getPipeline();
  if (!pipe) return false;
  // Run a tiny dummy to pre-load weights
  try {
    await pipe("test", { pooling: "mean", normalize: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether embeddings are available (pipeline initialized).
 */
export function isAvailable(): boolean {
  return _pipeline !== null;
}
