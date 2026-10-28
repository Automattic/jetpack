import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useEffect } from 'react';

/**
 * Re-read the connection when Back returns this page from history instead of loading it.
 *
 * Back from WordPress.com does that after Get started: the HTTP cache re-runs the page with
 * the connection it was rendered with, or bfcache restores it still marked as connecting.
 *
 * @param onRestore - Resets what the hand-off left behind in the caller. Keep it stable.
 */
export function useRestoredConnection( onRestore: () => void ): void {
	const { setConnectionStatus, setSiteIsRegistering, setUserIsConnecting } =
		useDispatch( CONNECTION_STORE_ID );

	useEffect( () => {
		const restore = () => {
			onRestore();
			setSiteIsRegistering( false );
			setUserIsConnecting( false );
			// A failed read leaves the page as it was, which is no worse than before.
			apiFetch( { path: '/jetpack/v4/connection' } ).then( setConnectionStatus, () => {} );
		};

		const [ navigation ] = window.performance?.getEntriesByType?.( 'navigation' ) ?? [];
		if ( ( navigation as PerformanceNavigationTiming | undefined )?.type === 'back_forward' ) {
			restore();
		}

		const onPageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
				restore();
			}
		};

		window.addEventListener( 'pageshow', onPageShow );
		return () => window.removeEventListener( 'pageshow', onPageShow );
	}, [ onRestore, setConnectionStatus, setSiteIsRegistering, setUserIsConnecting ] );
}
