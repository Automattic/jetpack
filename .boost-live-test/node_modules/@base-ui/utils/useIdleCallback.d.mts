export declare class IdleCallback {
  static create(): IdleCallback;
  currentId: number | null;
  /**
   * Schedules `fn` to run asynchronously after the current task (and thus the current commit),
   * clearing any previously scheduled call. With native `requestIdleCallback` the callback runs
   * during idle time after the next paint; the `setTimeout(0)` fallback runs after the current task
   * but is not guaranteed to run after the next paint.
   */
  start(fn: () => void): void;
  clear: () => void;
  disposeEffect: () => () => void;
}
/**
 * A `requestIdleCallback` with automatic cleanup and guard, mirroring `useTimeout`.
 *
 * Returns an imperative scheduler that runs a callback during idle time, after the current commit
 * and paint. In environments without `requestIdleCallback` it falls back to a macrotask
 * (`setTimeout(0)`), which runs after the current commit but is not guaranteed to run after the
 * next paint.
 */
export declare function useIdleCallback(): IdleCallback;