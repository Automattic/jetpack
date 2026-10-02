/**
 * Extracts the 2D translation and scale from the element's computed `transform` matrix.
 * Note that the `translate`, `rotate`, and `scale` longhands are separate properties and
 * are not reflected in the computed `transform` value.
 *
 * Pass `computedStyle` when the caller has already resolved it to avoid a second lookup.
 */
export declare function getElementTransform(element: HTMLElement, computedStyle?: CSSStyleDeclaration): {
  x: number;
  y: number;
  scale: number;
};