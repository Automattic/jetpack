/**
 * The position and dimensions of an element, relative to its offset parent.
 */
export type ElementOffsetRect = {
    /**
     * The element the rect belongs to.
     */
    element: HTMLElement | undefined;
    /**
     * The distance from the top edge of the offset parent to the top edge of
     * the element.
     */
    top: number;
    /**
     * The distance from the right edge of the offset parent to the right edge
     * of the element.
     */
    right: number;
    /**
     * The distance from the bottom edge of the offset parent to the bottom edge
     * of the element.
     */
    bottom: number;
    /**
     * The distance from the left edge of the offset parent to the left edge of
     * the element.
     */
    left: number;
    /**
     * The width of the element.
     */
    width: number;
    /**
     * The height of the element.
     */
    height: number;
};
/**
 * An `ElementOffsetRect` object with all values set to zero.
 */
export declare const NULL_ELEMENT_OFFSET_RECT: {
    element: undefined;
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
};
/**
 * Returns the position and dimensions of an element, relative to its offset
 * parent, with subpixel precision. Values reflect the real measures before any
 * potential scaling distortions along the X and Y axes.
 *
 * Useful in contexts where plain `getBoundingClientRect` calls or `ResizeObserver`
 * entries are not suitable, such as when the element is transformed, and when
 * `element.offset<Top|Left|Width|Height>` methods are not precise enough.
 *
 * **Note:** in some contexts, like when the scale is 0, this method will fail
 * because it's impossible to calculate a scaling ratio. When that happens, it
 * will return `undefined`.
 */
export declare function getElementOffsetRect(element: HTMLElement): ElementOffsetRect | undefined;
/**
 * Tracks the position and dimensions of an element, relative to its offset
 * parent. The element can be changed dynamically.
 *
 * When no element is provided (`null` or `undefined`), the hook will return
 * a "null" rect, in which all values are `0` and `element` is `undefined`.
 *
 * **Note:** sometimes, the measurement will fail (see `getElementOffsetRect`'s
 * documentation for more details). When that happens, this hook will attempt
 * to measure again after a frame, and if that fails, it will poll every 100
 * milliseconds until it succeeds.
 */
export declare function useTrackElementOffsetRect(targetElement: HTMLElement | undefined | null, deps?: unknown[]): ElementOffsetRect;
//# sourceMappingURL=element-rect.d.ts.map