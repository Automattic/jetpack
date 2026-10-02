/**
 * Hides all elements in the body element from screen-readers except
 * the provided element and elements that should not be hidden from
 * screen-readers.
 *
 * The reason we do this is because `aria-modal="true"` currently is bugged
 * in Safari, and support is spotty in other browsers overall. In the future
 * we should consider removing these helper functions in favor of
 * `aria-modal="true"`.
 *
 * @param modalElement The element that should not be hidden.
 */
export declare function modalize(modalElement?: HTMLDivElement): void;
/**
 * Determines if the passed element should not be hidden from screen readers.
 *
 * @param element The element that should be checked.
 *
 * @return Whether the element should not be hidden from screen-readers.
 */
export declare function elementShouldBeHidden(element: Element): boolean;
/**
 * Accessibly reveals the elements hidden by the latest modal.
 */
export declare function unmodalize(): void;
//# sourceMappingURL=aria-helper.d.ts.map