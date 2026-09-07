/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

const getViewportWidth = () => ( typeof window === 'undefined' ? 0 : window.innerWidth );

/**
 * Tracks the viewport width used to bound responsive data requests.
 *
 * @return The current viewport width in pixels.
 */
export function useViewportWidth(): number {
	const [ width, setWidth ] = useState( getViewportWidth );

	useEffect( () => {
		const updateWidth = () => setWidth( getViewportWidth() );

		window.addEventListener( 'resize', updateWidth );
		return () => window.removeEventListener( 'resize', updateWidth );
	}, [] );

	return width;
}
