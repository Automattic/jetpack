import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from 'react';
import { REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import type { Purchase } from '../../data/types';

type SitePurchases = { purchases: Purchase[] | null; isError: boolean };

/**
 * The site's purchases, fetched the first time `enabled` is true.
 *
 * Plain `apiFetch` rather than `useSimpleQuery`: the header also renders on Boost, outside My Jetpack's query and notice providers.
 *
 * @param enabled - Whether to fetch, e.g. once the popover has opened.
 * @return The purchases, or null until they load.
 */
export default function useSitePurchases( enabled: boolean ): SitePurchases {
	const [ result, setResult ] = useState< SitePurchases >( { purchases: null, isError: false } );
	const [ hasRequested, setHasRequested ] = useState( false );

	useEffect( () => {
		if ( ! enabled || hasRequested ) {
			return;
		}

		setHasRequested( true );
		apiFetch< Purchase[] >( { path: REST_API_SITE_PURCHASES_ENDPOINT } )
			.then( purchases => setResult( { purchases, isError: false } ) )
			.catch( () => setResult( { purchases: null, isError: true } ) );
	}, [ enabled, hasRequested ] );

	return result;
}
