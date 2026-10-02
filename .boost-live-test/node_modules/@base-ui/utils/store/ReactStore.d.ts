import { Store } from "./Store.js";
/**
 * A Store that supports controlled state keys, non-reactive values and provides utility methods for React.
 */
export declare class ReactStore<State extends object, Context = Record<string, never>, Selectors extends Record<string, SelectorFunction<State>> = Record<string, never>> extends Store<State> {
  /**
   * Creates a new ReactStore instance.
   *
   * @param state Initial state of the store.
   * @param context Non-reactive context values.
   * @param selectors Optional selectors for use with `useState`.
   */
  constructor(state: State, context?: Context, selectors?: Selectors);
  /**
   * Non-reactive values such as refs, callbacks, etc.
   */
  readonly context: Context;
  private selectors;
  /**
   * Synchronizes a single external value into the store.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValue<Key extends keyof State>(key: Key, value: State[Key]): void;
  /**
   * Synchronizes a single external value into the store and
   * cleans it up (sets to `undefined`) on unmount.
   *
   * Note that the while the value in `state` is updated immediately, the value returned
   * by `useState` is updated before the next render (similarly to React's `useState`).
   */
  useSyncedValueWithCleanup<Key extends KeysAllowingUndefined<State>>(key: Key, value: State[Key]): void;
  /**
   * Synchronizes multiple external values into the store.
   * Each value must match its state key. Pass an exact known subset rather than a broad
   * `Partial<State>`, which may contain `undefined` for required state fields.
   *
   * Note that the while the values in `state` are updated immediately, the values returned
   * by `useState` are updated before the next render (similarly to React's `useState`).
   *
   * @param statePart An exact subset of state fields to synchronize. Unknown keys are not accepted.
   */
  useSyncedValues<const Key extends keyof State>(statePart: Pick<State, Key>): void;
  /**
   * Registers a controllable prop pair (`controlled`, `defaultValue`) for a specific key. If `controlled`
   * is non-undefined, the store's state at `key` is updated to match `controlled`.
   */
  useControlledProp<Key extends keyof State>(key: Key, controlled: State[Key] | undefined): void;
  /** Gets the current value from the store using a selector with the provided key.
   *
   * @param key Key of the selector to use.
   */
  select<Key extends keyof Selectors>(key: Key, ...args: SelectorArgs<Selectors[Key]>): ReturnType<Selectors[Key]>;
  /**
   * Returns a value from the store's state using a selector function.
   * Used to subscribe to specific parts of the state.
   * This methods causes a rerender whenever the selected state changes.
   *
   * @param key Key of the selector to use.
   */
  useState<Key extends keyof Selectors>(key: Key, ...args: SelectorArgs<Selectors[Key]>): ReturnType<Selectors[Key]>;
  /**
   * Wraps a function with `useStableCallback` to ensure it has a stable reference
   * and assigns it to the context.
   *
   * @param key Key of the event callback. Must be a function in the context.
   * @param fn Function to assign.
   */
  useContextCallback<Key extends ContextFunctionKeys<Context>>(key: Key, fn: ContextFunction<Context, Key> | undefined): void;
  /**
   * Returns a stable setter function for a specific key in the store's state.
   * It's commonly used to pass as a ref callback to React elements.
   *
   * @param key Key of the state to set.
   */
  useStateSetter<const Key extends keyof State>(key: Key): (value: State[Key]) => void;
  /**
   * Observes changes derived from the store's selectors and calls the listener when the selected value changes.
   *
   * @param key Key of the selector to observe.
   * @param listener Listener function called when the selector result changes.
   */
  observe<Key extends keyof Selectors>(selector: Key, listener: (newValue: ReturnType<Selectors[Key]>, oldValue: ReturnType<Selectors[Key]>, store: this) => void): () => void;
  observe<Selector extends ObserveSelector<State>>(selector: Selector, listener: (newValue: ReturnType<Selector>, oldValue: ReturnType<Selector>, store: this) => void): () => void;
}
type MaybeCallable = (...args: any[]) => any;
type ContextFunctionKeys<Context> = { [Key in keyof Context]-?: Extract<Context[Key], MaybeCallable> extends never ? never : Key }[keyof Context];
type ContextFunction<Context, Key extends keyof Context> = Extract<Context[Key], MaybeCallable>;
type KeysAllowingUndefined<State> = { [Key in keyof State]-?: undefined extends State[Key] ? Key : never }[keyof State];
type ObserveSelector<State> = (state: State) => any;
type SelectorFunction<State> = (state: State, ...args: any[]) => any;
type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : [];
type SelectorArgs<Selector> = Selector extends ((...params: infer Params) => any) ? Tail<Params> : never;
export {};