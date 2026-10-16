import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../constants';
import { getSimpleQueryKey } from '../use-simple-query';
import useSitePurchases from '../use-site-purchases';
import type { Purchase } from '../types';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;
const purchases = [ { ID: 1, product_name: 'Jetpack Search' } ] as Purchase[];

describe( 'useSitePurchases', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( purchases );
	} );

	it( 'waits until enabled, then fetches once', async () => {
		const { result, rerender } = renderHook( ( { enabled } ) => useSitePurchases( enabled ), {
			initialProps: { enabled: false },
		} );

		expect( mockApiFetch ).not.toHaveBeenCalled();

		rerender( { enabled: true } );
		await waitFor( () => expect( result.current ).toEqual( purchases ) );
		rerender( { enabled: false } );
		rerender( { enabled: true } );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reuses the purchases a query client already holds', () => {
		const queryClient = new QueryClient();
		queryClient.setQueryData(
			getSimpleQueryKey( {
				name: QUERY_PURCHASES_KEY,
				query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
			} ),
			purchases
		);
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
		);

		const { result } = renderHook( () => useSitePurchases( true ), { wrapper } );

		expect( result.current ).toEqual( purchases );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
