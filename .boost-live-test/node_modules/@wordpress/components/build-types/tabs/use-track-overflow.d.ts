/**
 * Tracks if an element contains overflow and on which end by tracking the
 * first and last child elements with an `IntersectionObserver` in relation
 * to the parent element.
 *
 * Note that the returned value will only indicate whether the first or last
 * element is currently "going out of bounds" but not whether it happens on
 * the X or Y axis.
 */
export declare function useTrackOverflow(parent: HTMLElement | undefined | null, children: {
    first: HTMLElement | undefined | null;
    last: HTMLElement | undefined | null;
}): {
    first: boolean;
    last: boolean;
};
//# sourceMappingURL=use-track-overflow.d.ts.map