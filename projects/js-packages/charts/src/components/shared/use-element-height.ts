import { useRef, useState, useLayoutEffect, RefObject } from 'react';

/**
 * Hook to measure the height of a DOM element.
 * Returns a ref to attach to the element and the current height in pixels.
 *
 * @param {object} props               - Optional props.
 * @param {number} props.initialHeight - The initial height to use.
 *
 * @return {[RefObject<T>, number]} A tuple containing a ref to attach to the element and the current height in pixels
 */
export function useElementHeight< T extends HTMLElement = HTMLDivElement >( {
	initialHeight = 0,
}: {
	initialHeight?: number;
} = {} ): [ RefObject< T >, number ] {
	const ref = useRef< T >( null );
	const [ height, setHeight ] = useState( initialHeight );

	useLayoutEffect( () => {
		if ( ! ref.current ) return;

		const handleResize = () => {
			setHeight( ref.current?.getBoundingClientRect().height || 0 );
		};

		handleResize(); // Initial measurement

		const resizeObserver = new window.ResizeObserver( handleResize );
		resizeObserver.observe( ref.current );

		return () => {
			resizeObserver.disconnect();
		};
	}, [] );

	return [ ref, height ];
}
