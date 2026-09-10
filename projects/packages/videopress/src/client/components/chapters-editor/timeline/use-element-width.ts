/**
 * Observe an element's on-screen width.
 *
 * Lives in its own module so jsdom tests — where layout always reports 0 —
 * can `jest.mock` it and hand the timeline a deterministic viewport width.
 */
import { useCallback, useRef, useState } from 'react';

/**
 * Value returned by {@link useElementWidth}.
 */
export interface ElementWidth {
	/** Callback ref to attach to the measured element (or null to detach). */
	ref: ( element: HTMLElement | null ) => void;
	/** Current width in px; 0 until the element attaches and reports one. */
	width: number;
}

/**
 * Track an element's content-box width via ResizeObserver (with a one-shot
 * getBoundingClientRect fallback where ResizeObserver is unavailable).
 *
 * @return The callback ref and the current width.
 */
export function useElementWidth(): ElementWidth {
	const [ width, setWidth ] = useState( 0 );
	const observerRef = useRef< ResizeObserver | null >( null );

	const ref = useCallback( ( element: HTMLElement | null ) => {
		observerRef.current?.disconnect();
		observerRef.current = null;
		if ( ! element ) {
			return;
		}
		setWidth( element.getBoundingClientRect().width );
		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}
		observerRef.current = new ResizeObserver( entries => {
			const entry = entries[ entries.length - 1 ];
			setWidth( entry.contentRect.width );
		} );
		observerRef.current.observe( element );
	}, [] );

	return { ref, width };
}
