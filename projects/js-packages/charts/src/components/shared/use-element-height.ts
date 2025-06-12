import { useState, useCallback, useRef } from 'react';

/**
 * Hook to measure the height of a DOM element.
 * Returns a ref to attach to the element and the current height in pixels.
 *
 * @param {object} props               - Optional props.
 * @param {number} props.initialHeight - The initial height to use.
 *
 * @return {[Function, number]} A tuple containing a ref to attach to the element and the current height in pixels
 */
export function useElementHeight< T extends HTMLElement = HTMLDivElement >( {
	initialHeight = 0,
}: {
	initialHeight?: number;
} = {} ): [ ( node: T | null ) => void, number ] {
	const [ height, setHeight ] = useState( initialHeight );
	const observerRef = useRef< ResizeObserver | null >( null );

	const refCallback = useCallback( ( node: T | null ) => {
		if ( observerRef.current ) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}
		if ( node ) {
			const handleResize = () => {
				setHeight( node.getBoundingClientRect().height || 0 );
			};
			handleResize();
			const resizeObserver = new window.ResizeObserver( handleResize );
			resizeObserver.observe( node );
			observerRef.current = resizeObserver;
		}
	}, [] );

	return [ refCallback, height ];
}
