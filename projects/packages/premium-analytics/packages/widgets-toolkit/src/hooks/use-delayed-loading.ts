/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

export function useDelayedLoading( isLoading: boolean, delay = 400 ): boolean {
	const [ showLoader, setShowLoader ] = useState( false );

	useEffect( () => {
		if ( ! isLoading ) {
			return;
		}
		const timeout = setTimeout( () => setShowLoader( true ), delay );
		return () => {
			clearTimeout( timeout );
			setShowLoader( false );
		};
	}, [ isLoading, delay ] );

	return showLoader;
}
