import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Whether this person has asked for less movement.
 *
 * Almost everything in the wizard answers that question in CSS, which is the
 * right place for it. This exists for the one case a media query cannot express:
 * the finish screen's wash discs are not a shorter animation under reduced
 * motion, they are not rendered at all.
 *
 * @return True when reduced motion is preferred.
 */
export function useReducedMotion(): boolean {
	const [ reduced, setReduced ] = useState( () =>
		typeof window.matchMedia === 'function' ? window.matchMedia( QUERY ).matches : false
	);

	useEffect( () => {
		if ( typeof window.matchMedia !== 'function' ) {
			return;
		}

		const list = window.matchMedia( QUERY );
		const onChange = () => setReduced( list.matches );

		list.addEventListener( 'change', onChange );

		return () => list.removeEventListener( 'change', onChange );
	}, [] );

	return reduced;
}
