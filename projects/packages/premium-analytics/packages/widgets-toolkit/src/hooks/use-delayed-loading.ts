/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * True once `isLoading` has stayed true for `delay` milliseconds, false again
 * the moment it clears.
 *
 * Gates a loading affordance so a fetch that resolves quickly never draws one.
 * Most refetches here land well inside the default, so the widget simply swaps
 * its numbers instead of flashing a skeleton on the way.
 *
 * Ported from Gutenberg's `useDelayedLoading` (`@wordpress/dataviews`), which
 * gates the same treatment on its tables.
 *
 * @param isLoading - Whether a fetch is in flight.
 * @param delay     - How long it must stay in flight to be worth showing, in ms.
 * @return Whether the loading affordance should be shown.
 */
export function useDelayedLoading( isLoading: boolean, delay = 400 ): boolean {
	const [ showLoader, setShowLoader ] = useState( false );

	useEffect( () => {
		if ( ! isLoading ) {
			return;
		}
		const timeout = setTimeout( () => setShowLoader( true ), delay );
		// Also resets on the way out: the cleanup runs when `isLoading` clears.
		return () => {
			clearTimeout( timeout );
			setShowLoader( false );
		};
	}, [ isLoading, delay ] );

	return showLoader;
}
