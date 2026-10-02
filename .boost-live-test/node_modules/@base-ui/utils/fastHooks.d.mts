import * as React from 'react';
export type Instance = {
  didInitialize: boolean;
};
type HookType = {
  before: (instance: any) => void;
  after: (instance: any) => void;
};
export declare function getInstance(): Instance | undefined;
export declare function setInstance(instance: Instance | undefined): void;
export declare function register(hook: HookType): void;
/**
 * Wraps a component function to enable performance optimizations for internal hooks.
 *
 * **Performance Optimization:**
 * Components wrapped with `fastComponent` have access to a shared "instance" context that enables
 * specialized hook implementations to batch operations and reduce overhead. The wrapper creates a
 * stable instance object that persists across renders, sets it as the current context, calls
 * registered hooks before and after rendering, then clears the context. The primary benefit is
 * with `useStore`, where multiple store subscriptions within the same component are collapsed into
 * a single `useSyncExternalStore` subscription per store, significantly reducing re-render overhead.
 * This optimization is only active on React 19+; on earlier versions `useStore` falls back to a
 * separate subscription per call.
 *
 * **Requirements:**
 * - The component function should follow standard React component patterns
 * - `useStore` calls must keep a stable order and count across renders, as batched hooks are
 *   matched by call index
 * - Do not rely on the instance context outside of specialized hooks
 *
 * @param fn - The component function to wrap
 * @returns A wrapped component with the same signature as the input function
 *
 * @example
 * ```tsx
 * // Wrapping a component to enable optimized useStore batching
 * export const TooltipRoot = fastComponent(function TooltipRoot(props) {
 *   // These useStore calls share a single subscription
 *   const open = useStore(store, (state) => state.open);
 *   const disabled = useStore(store, (state) => state.disabled);
 *   const value = useStore(store, (state) => state.value);
 *   // ...
 * });
 * ```
 */
export declare function fastComponent<P extends object, E extends HTMLElement, R extends React.ReactNode>(fn: (props: P) => R): typeof fn;
/**
 * Wraps a component function with ref forwarding to enable performance optimizations for internal hooks.
 *
 * This is a convenience wrapper that combines `fastComponent` with `React.forwardRef`, enabling
 * both performance optimizations and proper ref forwarding. See `fastComponent` for details on
 * the performance benefits.
 *
 * @param fn - The component function that accepts props and a forwarded ref
 * @returns A wrapped component with ref forwarding enabled
 *
 * @example
 * ```tsx
 * // Wrapping a component with ref forwarding and optimized hooks
 * export const TooltipTrigger = fastComponentRef(function TooltipTrigger(
 *   props,
 *   forwardedRef
 * ) {
 *   const store = useContext(TooltipContext);
 *   const open = useStore(store, (state) => state.open);
 *   // ... component logic with ref
 *   return <button ref={forwardedRef} {...props} />;
 * });
 * ```
 */
export declare function fastComponentRef<P extends object, E extends Element, R extends React.ReactNode>(fn: (props: React.PropsWithoutRef<P>, forwardedRef: React.Ref<E>) => R): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<E>>;
export {};