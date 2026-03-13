import { useState, useEffect } from 'react';

// 'no-preference' returns false in unsupported browsers,
// causing a safe fallback to reduced motion instead of animating.
const QUERY = '(prefers-reduced-motion: no-preference)';

const getInitialState = () => ! window.matchMedia( QUERY ).matches;

/**
 * Custom hook to determine if the user prefers reduced motion.
 * @return {boolean} A boolean indicating the user's preference for reduced motion.
 */
export function usePrefersReducedMotion() {
	const [ prefersReducedMotion, setPrefersReducedMotion ] = useState( getInitialState );

	useEffect( () => {
		const mediaQueryList = window.matchMedia( QUERY );

		const listener = event => {
			setPrefersReducedMotion( ! event.matches );
		};

		mediaQueryList.addEventListener( 'change', listener );

		return () => {
			mediaQueryList.removeEventListener( 'change', listener );
		};
	}, [] );

	return prefersReducedMotion;
}
