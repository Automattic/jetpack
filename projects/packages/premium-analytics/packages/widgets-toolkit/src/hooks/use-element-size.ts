/**
 * External dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useCallback, useRef, useState } from 'react';

export type ElementSize = { width: number; height: number };

function getElementSize( element: Element ): ElementSize {
	const { width, height } = element.getBoundingClientRect();
	return { width: Math.round( width ), height: Math.round( height ) };
}

/**
 * Tracks an element's rendered size via ResizeObserver, so a chart can be
 * bounded by the width and height its tile actually offers (not only its width).
 *
 * @return A tuple of a ref callback to attach to the element and its current size.
 */
export function useElementSize< T extends HTMLElement >() {
	const elementRef = useRef< T | null >( null );
	const [ size, setSize ] = useState< ElementSize >( { width: 0, height: 0 } );

	const updateSize = useCallback( ( next: ElementSize ) => {
		setSize( prev => ( prev.width === next.width && prev.height === next.height ? prev : next ) );
	}, [] );

	const observerRef = useResizeObserver< T >( entries => {
		const element = entries[ 0 ]?.target ?? elementRef.current;
		if ( element ) {
			updateSize( getElementSize( element ) );
		}
	} );

	const setElementRef = useCallback(
		( element: T | null ) => {
			elementRef.current = element;
			if ( typeof ResizeObserver !== 'undefined' ) {
				observerRef( element );
			}
			if ( element ) {
				updateSize( getElementSize( element ) );
			}
		},
		[ observerRef, updateSize ]
	);

	return [ setElementRef, size ] as const;
}
