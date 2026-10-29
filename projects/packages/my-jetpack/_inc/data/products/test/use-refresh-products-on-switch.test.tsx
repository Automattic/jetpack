import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import {
	QUERY_PRODUCT_BY_OWNERSHIP_KEY,
	QUERY_PRODUCT_KEY,
	QUERY_PURCHASES_KEY,
	REST_API_SITE_PRODUCTS_ENDPOINT,
	REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT,
	REST_API_SITE_PURCHASES_ENDPOINT,
} from '../../constants';
import { getSimpleQueryKey } from '../../use-simple-query';
import { useRefreshProductsOnSwitch } from '../use-refresh-products-on-switch';
import type { FC, ReactNode } from 'react';

const PRODUCTS = getSimpleQueryKey( {
	name: QUERY_PRODUCT_KEY,
	query: { path: REST_API_SITE_PRODUCTS_ENDPOINT },
} );
const OWNERSHIP = getSimpleQueryKey( {
	name: QUERY_PRODUCT_BY_OWNERSHIP_KEY,
	query: { path: REST_API_SITE_PRODUCTS_OWNERSHIP_ENDPOINT },
} );
const PURCHASES = getSimpleQueryKey( {
	name: QUERY_PURCHASES_KEY,
	query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
} );

describe( 'useRefreshProductsOnSwitch', () => {
	beforeAll( () => {
		apiFetch.setFetchHandler( () => Promise.resolve( {} ) );
	} );

	it( 'marks the products and their ownership stale once a switch is written', async () => {
		const client = new QueryClient();
		[ PRODUCTS, OWNERSHIP, PURCHASES ].forEach( key => client.setQueryData( key, {} ) );
		const wrapper: FC< { children: ReactNode } > = ( { children } ) => (
			<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
		);
		const { unmount } = renderHook( () => useRefreshProductsOnSwitch(), { wrapper } );

		await apiFetch( { path: '/jetpack/v4/module/protect-dashboard/active', method: 'POST' } );

		expect( client.getQueryState( PRODUCTS )?.isInvalidated ).toBe( true );
		expect( client.getQueryState( OWNERSHIP )?.isInvalidated ).toBe( true );
		expect( client.getQueryState( PURCHASES )?.isInvalidated ).toBe( false );

		unmount();
	} );
} );
