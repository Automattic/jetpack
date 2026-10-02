/**
 * Context object for the `onUpdate` callback of `useOnValueUpdate`.
 */
export type ValueUpdateContext<T> = {
    previousValue: T;
};
/**
 * Calls the `onUpdate` callback when the `value` changes.
 */
export declare function useOnValueUpdate<T>(
/**
 * The value to watch for changes.
 */
value: T, 
/**
 * Callback to fire when the value changes.
 */
onUpdate: (context: ValueUpdateContext<T>) => void): void;
//# sourceMappingURL=use-on-value-update.d.ts.map