/**
 * Untracks the provided value by turning it into a ref to remove its reactivity.
 *
 * Used to access the passed value inside `React.useEffect` without causing the effect to re-run when the value changes.
 */
export declare function useValueAsRef<T>(value: T): {
  current: T;
  next: T;
  effect: () => void;
};