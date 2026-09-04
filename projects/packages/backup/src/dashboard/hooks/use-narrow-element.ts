import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Tracks whether the observed element is narrower than `threshold`.
 *
 * Measures the element, not the viewport: collapsing the admin menu shifts the
 * content column at an unchanged window width, and crossing 782px widens the
 * sidebar rather than narrowing it — a media query gets both wrong.
 *
 * @param threshold - Inline size, in px, at and above which the element is wide.
 * @return A callback ref to put on the element, and whether it is currently narrow.
 */
export default function useNarrowElement(
	threshold: number
): [ ( node: HTMLElement | null ) => void, boolean ] {
	const [ isNarrow, setIsNarrow ] = useState( false );
	const observerRef = useRef< ResizeObserver | null >( null );
	// Read through a ref so the callback ref stays stable across threshold
	// changes; re-creating it would detach and re-attach the observer.
	const thresholdRef = useRef( threshold );
	thresholdRef.current = threshold;

	useEffect( () => () => observerRef.current?.disconnect(), [] );

	const ref = useCallback( ( node: HTMLElement | null ) => {
		observerRef.current?.disconnect();
		observerRef.current = null;
		if ( ! node ) {
			return;
		}
		// A detached or `display: none` element measures zero, which is not a
		// width — keep whatever we last knew rather than reading it as narrow.
		const apply = ( size: number | undefined ) => {
			if ( size !== undefined && size > 0 ) {
				setIsNarrow( size < thresholdRef.current );
			}
		};
		// The observer's first delivery waits for a paint, and a hidden or
		// throttled tab never has one — so measure now and let it correct us.
		apply( node.getBoundingClientRect().width );
		const observer = new ResizeObserver( entries =>
			apply( entries.at( -1 )?.contentBoxSize?.[ 0 ]?.inlineSize )
		);
		observer.observe( node );
		observerRef.current = observer;
	}, [] );

	return [ ref, isNarrow ];
}
