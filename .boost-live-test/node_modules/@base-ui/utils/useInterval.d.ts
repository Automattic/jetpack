import { Timeout } from "./useTimeout.js";
export declare class Interval extends Timeout {
  static create(): Interval;
  /**
   * Executes `fn` at `delay` interval, clearing any previously scheduled call.
   */
  start(delay: number, fn: Function): void;
  clear: () => void;
}
/**
 * A `setInterval` with automatic cleanup and guard.
 */
export declare function useInterval(): Interval;