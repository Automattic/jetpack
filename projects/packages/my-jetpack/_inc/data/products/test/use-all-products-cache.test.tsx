import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useAllProducts } from '../use-all-products';
import type { PropsWithChildren } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../notices/use-fetching-error-notice', () => ( {
	useFetchingErrorNotice: jest.fn(),
} ) );

it( 'reuses a fresh catalog across observers and fetches again after five minutes', async () => {
	jest.useFakeTimers();
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false, gcTime: Infinity } },
	} );
	const wrapper = ( { children }: PropsWithChildren ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
	const pro = { pricing_for_ui: { available: true, catalog_available: true } };
	window.myJetpackInitialState = {
		products: { items: { pro } },
	} as unknown as Window[ 'myJetpackInitialState' ];
	jest.mocked( apiFetch ).mockResolvedValue( { pro } );
	try {
		const { result } = renderHook( useAllProducts, { wrapper } );
		await waitFor( () => expect( result.current.data.pro.pricingForUi.available ).toBe( true ) );
		renderHook( useAllProducts, { wrapper } );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		act( () => jest.advanceTimersByTime( 5 * 60 * 1000 + 1 ) );
		renderHook( useAllProducts, { wrapper } );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );
	} finally {
		client.clear();
		jest.useRealTimers();
	}
} );
