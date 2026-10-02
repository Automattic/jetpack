interface ElementBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
/**
 * Determines if a mouse event occurred within the bounds of an element
 * (including its pseudo-elements), with a small tolerance for pointer drift.
 */
export declare function isMouseWithinBounds(event: MouseEvent, element: HTMLElement): boolean;
export declare function getPseudoElementBounds(element: HTMLElement): ElementBounds;
export {};