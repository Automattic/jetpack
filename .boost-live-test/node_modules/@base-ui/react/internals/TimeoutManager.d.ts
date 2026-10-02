/**
 * A utility class to manage multiple timeouts.
 */
export declare class TimeoutManager {
  private ids;
  start: (key: string, delay: number, fn: () => void) => void;
  clear: (key: string) => void;
  clearAll: () => void;
}