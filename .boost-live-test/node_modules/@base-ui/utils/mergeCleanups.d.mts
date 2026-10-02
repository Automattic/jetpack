type Cleanup = false | null | undefined | (() => void);
/**
 * Combines multiple cleanup functions into a single cleanup function.
 */
export declare function mergeCleanups(...cleanups: Cleanup[]): () => void;
export {};