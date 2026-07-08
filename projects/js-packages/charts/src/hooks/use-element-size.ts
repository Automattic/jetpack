import { useState, useCallback, useRef } from 'react';

/**
 * Hook to measure the width and height of a DOM element.
 * Returns a ref callback to attach to the element and the current dimensions in pixels.
 *
 * @param {object} props               - Optional props.
 * @param {number} props.initialWidth  - The initial width to use.
 * @param {number} props.initialHeight - The initial height to use.
 *
 * @return {[Function, number, number]} A tuple containing a ref callback, width, and height in pixels
 */
export function useElementSize< T extends HTMLElement = HTMLDivElement >( {
	initialWidth = 0,
	initialHeight = 0,
}: {
	initialWidth?: number;
	initialHeight?: number;
} = {} ): [ ( node: T | null ) => void, number, number ] {
	const [ width, setWidth ] = useState( initialWidth );
	const [ height, setHeight ] = useState( initialHeight );
	const observerRef = useRef< ResizeObserver | null >( null );

	const refCallback = useCallback( ( node: T | null ) => {
		if ( observerRef.current ) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}
		if ( node ) {
			const handleResize = () => {
				const rect = node.getBoundingClientRect();
				setWidth( rect.width || 0 );
				setHeight( rect.height || 0 );
			};
			handleResize();
			const resizeObserver = new ResizeObserver( handleResize );
			resizeObserver.observe( node );
			observerRef.current = resizeObserver;
		}
	}, [] );

	return [ refCallback, width, height ];
}
