import type { MapSelect, StoreDescriptor, AnyConfig, UseSelectReturn } from '../../types';
/**
 * Custom react hook for retrieving props from registered selectors.
 *
 * In general, this custom React hook follows the
 * [rules of hooks](https://react.dev/reference/rules/rules-of-hooks).
 *
 * @param mapSelect Function called on every state change. The returned value is
 *                  exposed to the component implementing this hook. The function
 *                  receives the `registry.select` method on the first argument
 *                  and the `registry` on the second argument.
 *                  When a store key is passed, all selectors for the store will be
 *                  returned. This is only meant for usage of these selectors in event
 *                  callbacks, not for data needed to create the element tree.
 * @param deps      If provided, this memoizes the mapSelect so the same `mapSelect` is
 *                  invoked on every state change unless the dependencies change.
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * function HammerPriceDisplay( { currency } ) {
 *   const price = useSelect( ( select ) => {
 *     return select( myCustomStore ).getPrice( 'hammer', currency );
 *   }, [ currency ] );
 *   return new Intl.NumberFormat( 'en-US', {
 *     style: 'currency',
 *     currency,
 *   } ).format( price );
 * }
 *
 * // Rendered in the application:
 * // <HammerPriceDisplay currency="USD" />
 * ```
 *
 * In the above example, when `HammerPriceDisplay` is rendered into an
 * application, the price will be retrieved from the store state using the
 * `mapSelect` callback on `useSelect`. If the currency prop changes then
 * any price in the state for that currency is retrieved. If the currency prop
 * doesn't change and other props are passed in that do change, the price will
 * not change because the dependency is just the currency.
 *
 * When data is only used in an event callback, the data should not be retrieved
 * on render, so it may be useful to get the selectors function instead.
 *
 * **Don't use `useSelect` this way when calling the selectors in the render
 * function because your component won't re-render on a data change.**
 *
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * function Paste( { children } ) {
 *   const { getSettings } = useSelect( myCustomStore );
 *   function onPaste() {
 *     // Do something with the settings.
 *     const settings = getSettings();
 *   }
 *   return <div onPaste={ onPaste }>{ children }</div>;
 * }
 * ```
 *
 * @return The selected data or store selectors.
 */
export default function useSelect<T extends MapSelect | StoreDescriptor<AnyConfig>>(mapSelect: T, deps?: unknown[]): UseSelectReturn<T>;
/**
 * A variant of the `useSelect` hook that has the same API, but is a compatible
 * Suspense-enabled data source.
 *
 * @param mapSelect Function called on every state change. The
 *                  returned value is exposed to the component
 *                  using this hook. The function receives the
 *                  `registry.suspendSelect` method as the first
 *                  argument and the `registry` as the second one.
 * @param deps      A dependency array used to memoize the `mapSelect`
 *                  so that the same `mapSelect` is invoked on every
 *                  state change unless the dependencies change.
 *
 * @throws A suspense Promise that is thrown if any of the called
 * selectors is in an unresolved state.
 *
 * @return Data object returned by the `mapSelect` function.
 */
export declare function useSuspenseSelect<T extends MapSelect>(mapSelect: T, deps: unknown[]): ReturnType<T>;
//# sourceMappingURL=index.d.ts.map