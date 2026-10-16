import { QueryClientContext, type QueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useContext, useEffect, useState } from 'react';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import { getSimpleQueryKey } from '../../data/use-simple-query';
import type { Purchase } from '../../data/types';

const PURCHASES_QUERY = { path: REST_API_SITE_PURCHASES_ENDPOINT };

/**
 * The site's purchases: the Overview's, where it has loaded them, else fetched the first time `enabled` is true.
 *
 * Plain `apiFetch` rather than `useSimpleQuery`: the header also renders on Boost, outside My Jetpack's query and notice providers.
 *
 * @param enabled - Whether to fetch, e.g. once the popover has opened.
 * @return The purchases, or null until they load or if the request fails.
 */
export default function useSitePurchases( enabled: boolean ): Purchase[] | null {
	const queryClient = useContext( QueryClientContext ) as QueryClient | undefined;
	const cached = queryClient?.getQueryData< Purchase[] >(
		getSimpleQueryKey( { name: QUERY_PURCHASES_KEY, query: PURCHASES_QUERY } )
	);
	const [ purchases, setPurchases ] = useState< Purchase[] | null >( null );
	const [ hasRequested, setHasRequested ] = useState( false );

	useEffect( () => {
		if ( ! enabled || hasRequested || cached ) {
			return;
		}

		setHasRequested( true );
		apiFetch< Purchase[] >( PURCHASES_QUERY )
			.then( setPurchases )
			.catch( () => setPurchases( null ) );
	}, [ enabled, hasRequested, cached ] );

	return cached ?? purchases;
}
