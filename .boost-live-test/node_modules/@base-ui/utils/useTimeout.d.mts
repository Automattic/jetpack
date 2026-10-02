type TimeoutId = number;
export declare class Timeout {
  static create(): Timeout;
  currentId: TimeoutId;
  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(delay: number, fn: Function): void;
  isStarted(): boolean;
  clear: () => void;
  disposeEffect: () => () => void;
}
/**
 * A `setTimeout` with automatic cleanup and guard.
 */
export declare function useTimeout(): Timeout;
export {};