/**
 * Manages scroll lock for anchored popups. For non-touch opens, scroll lock is applied when
 * enabled. For touch opens, scroll lock is applied only when the positioner width is effectively
 * viewport-sized.
 */
export declare function useAnchoredPopupScrollLock(enabled: boolean, touchOpen: boolean, positionerElement: HTMLElement | null, referenceElement: Element | null): void;