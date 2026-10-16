import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import type { Purchase } from '../../data/types';

/**
 * The site's purchases, fetched the first time `enabled` is true.
 *
 * Plain `apiFetch` rather than `useSimpleQuery`: the header also renders on Boost, outside My Jetpack's query and notice providers.
 *
 * @param enabled - Whether to fetch, e.g. once the popover has opened.
 * @return The purchases, or null until they load or if the request fails.
 */
export default function useSitePurchases( enabled: boolean ): Purchase[] | null {
	const [ purchases, setPurchases ] = useState< Purchase[] | null >( null );
	const [ hasRequested, setHasRequested ] = useState( false );

	useEffect( () => {
		if ( ! enabled || hasRequested ) {
			return;
		}

		setHasRequested( true );
		apiFetch< Purchase[] >( { path: REST_API_SITE_PURCHASES_ENDPOINT } )
			.then( setPurchases )
			.catch( () => setPurchases( null ) );
	}, [ enabled, hasRequested ] );

	return purchases;
}
