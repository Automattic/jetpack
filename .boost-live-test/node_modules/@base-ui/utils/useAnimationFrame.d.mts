type AnimationFrameId = number;
/**
 * Replaces the shared scheduler and drops all pending animation frame callbacks.
 *
 * For test environments only. The scheduler is process-global, so a callback scheduled in one test
 * but never run (e.g. requested under fake timers that were torn down before the frame fired) would
 * otherwise survive into a later test and run there against stale state. Call between tests to drop
 * such leftovers.
 */
export declare function resetAnimationFrameScheduler(): void;
export declare class AnimationFrame {
  static create(): AnimationFrame;
  static request(fn: FrameRequestCallback): number;
  static cancel(id: AnimationFrameId): void;
  currentId: AnimationFrameId | null;
  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  request(fn: Function): void;
  cancel: () => void;
  disposeEffect: () => () => void;
}
/**
 * A `requestAnimationFrame` with automatic cleanup and guard.
 */
export declare function useAnimationFrame(): AnimationFrame;
export {};