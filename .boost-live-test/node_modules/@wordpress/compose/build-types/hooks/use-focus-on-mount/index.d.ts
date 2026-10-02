/**
 * Determines focus behavior when the element mounts.
 *
 * @param focusOnMount Behavioral mode. Defaults to `"firstElement"` which focuses the
 *                     first tabbable element within; `"firstInputElement"` focuses the
 *                     first value control within; `true` focuses the element itself;
 *                     `false` does nothing.
 * @return Ref callback.
 *
 * @example
 * ```js
 * import { useFocusOnMount } from '@wordpress/compose';
 *
 * const WithFocusOnMount = () => {
 *     const ref = useFocusOnMount()
 *     return (
 *         <div ref={ ref }>
 *             <Button />
 *             <Button />
 *         </div>
 *     );
 * }
 * ```
 */
export declare function useFocusOnMount(focusOnMount?: useFocusOnMount.Mode): import("react").RefCallback<HTMLElement | null>;
export declare namespace useFocusOnMount {
    type Mode = boolean | 'firstElement' | 'firstInputElement';
}
//# sourceMappingURL=index.d.ts.map