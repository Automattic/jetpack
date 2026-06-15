import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * Gap kept between the tooltip and the viewport edge, in pixels.
 */
const VIEWPORT_EDGE_PADDING = 16;

type ClampResult< T > = {
	/** Callback ref to attach to the tooltip element. */
	ref: ( element: T | null ) => void;
	/** Style to spread onto the tooltip element (a corrective transform, or undefined). */
	style: CSSProperties | undefined;
};

/**
 * Keeps an HTML tooltip inside the horizontal bounds of the viewport.
 *
 * visx positions the tooltip with an inline `transform` on its `.visx-tooltip`
 * portal node and, with `detectBounds` enabled, tries to flip it so it does not
 * overflow. That flip is powered by `@visx/tooltip`'s `withBoundingRects`, which
 * measures the tooltip's width only once — on mount — and never again. When the
 * content width changes between data points during a single continuous hover
 * (longer labels, different value widths, late font loads), the flip decision is
 * made against a stale width, so a wide tooltip near the right edge gets clipped.
 *
 * This hook compensates at the layer that owns tooltip rendering: it measures the
 * element after each content change / resize and applies a corrective horizontal
 * shift so the box stays within the viewport. It reads the element's own rect —
 * which already reflects visx's transform — so it needs no knowledge of the chart
 * container, the portal, or the hovered datum's anchor position.
 *
 * @param externalRef - Optional ref the caller also needs on the element (e.g. for focus management).
 * @return A `ref` to attach and a `style` to spread onto the tooltip element.
 */
export function useViewportClamp< T extends HTMLElement = HTMLDivElement >(
	externalRef?: ( element: T | null ) => void
): ClampResult< T > {
	const nodeRef = useRef< T | null >( null );
	// Mirrors `shiftPx` so the measurement callback can read the currently
	// applied shift synchronously without re-subscribing observers on change.
	const shiftRef = useRef( 0 );
	const [ shiftPx, setShiftPx ] = useState( 0 );

	const ref = useCallback(
		( element: T | null ) => {
			nodeRef.current = element;
			externalRef?.( element );
		},
		[ externalRef ]
	);

	useLayoutEffect( () => {
		const node = nodeRef.current;
		if ( ! node || typeof window === 'undefined' ) {
			return;
		}

		const update = () => {
			const rect = node.getBoundingClientRect();
			// Nothing rendered yet (hidden, not measured) — leave the shift be.
			if ( rect.width === 0 ) {
				return;
			}

			// Strip our own shift to recover visx's natural placement. `translateX`
			// does not affect width, so the measured width can be used as-is.
			const naturalLeft = rect.left - shiftRef.current;
			const maxRight = window.innerWidth - VIEWPORT_EDGE_PADDING;

			let nextShift = 0;
			const rightOverflow = naturalLeft + rect.width - maxRight;
			if ( rightOverflow > 0 ) {
				nextShift = -rightOverflow;
			}
			// Don't pull the left edge past the padding on the opposite side. When
			// the tooltip is wider than the available space an unavoidable right
			// overflow is preferable to hiding the left edge.
			if ( naturalLeft + nextShift < VIEWPORT_EDGE_PADDING ) {
				nextShift = VIEWPORT_EDGE_PADDING - naturalLeft;
			}

			nextShift = Math.round( nextShift );
			if ( nextShift !== shiftRef.current ) {
				shiftRef.current = nextShift;
				setShiftPx( nextShift );
			}
		};

		update();

		// visx writes the placement transform asynchronously (a post-mount bounds
		// refresh) and again on every reposition. The transformed node is our
		// parent (the `.visx-tooltip` portal element), so watch its inline style.
		const anchor = node.parentElement;
		const styleObserver = anchor ? new MutationObserver( update ) : null;
		styleObserver?.observe( anchor as HTMLElement, {
			attributes: true,
			attributeFilter: [ 'style' ],
		} );

		// Content width can change between data points without a remount.
		const sizeObserver =
			typeof ResizeObserver !== 'undefined' ? new ResizeObserver( update ) : null;
		sizeObserver?.observe( node );

		window.addEventListener( 'resize', update );
		return () => {
			styleObserver?.disconnect();
			sizeObserver?.disconnect();
			window.removeEventListener( 'resize', update );
		};
	}, [] );

	return {
		ref,
		style: shiftPx ? { transform: `translateX(${ shiftPx }px)` } : undefined,
	};
}
