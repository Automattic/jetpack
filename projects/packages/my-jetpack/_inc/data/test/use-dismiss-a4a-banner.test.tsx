import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { QUERY_GET_JETPACK_MANAGE_DATA_KEY, REST_API_GET_JETPACK_MANAGE_DATA } from '../constants';
import useDismissA4ABanner from '../use-dismiss-a4a-banner';
import type { FC, ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as unknown as jest.MockedFunction< typeof apiFetch >;

const MANAGE_DATA_KEY = [
	QUERY_GET_JETPACK_MANAGE_DATA_KEY,
	{ path: REST_API_GET_JETPACK_MANAGE_DATA },
];

let queryClient: QueryClient;

const createWrapper = (): FC< { children: ReactNode } > => {
	queryClient = new QueryClient( {
		defaultOptions: { mutations: { retry: false } },
	} );
	return ( { children } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
};

describe( 'useDismissA4ABanner', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'starts not pending', () => {
		const { result } = renderHook( () => useDismissA4ABanner(), { wrapper: createWrapper() } );

		expect( result.current.isPending ).toBe( false );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'POSTs to the dismissal endpoint', async () => {
		mockApiFetch.mockResolvedValue( { success: true } );

		const { result } = renderHook( () => useDismissA4ABanner(), { wrapper: createWrapper() } );

		result.current.dismiss();

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: 'my-jetpack/v1/jetpack-manage/dismiss-banner',
					method: 'POST',
				} )
			)
		);
	} );

	it( 'reflects the pending state while the request is in flight', async () => {
		let resolveFetch: ( value: { success: boolean } ) => void;
		mockApiFetch.mockReturnValue(
			new Promise( resolve => {
				resolveFetch = resolve;
			} )
		);

		const { result } = renderHook( () => useDismissA4ABanner(), { wrapper: createWrapper() } );

		result.current.dismiss();

		await waitFor( () => expect( result.current.isPending ).toBe( true ) );

		resolveFetch( { success: true } );

		await waitFor( () => expect( result.current.isPending ).toBe( false ) );
	} );
	it( 'marks the cached jetpack-manage payload dismissed, so a remount does not re-show the banner', async () => {
		mockApiFetch.mockResolvedValue( { success: true } );

		const wrapper = createWrapper();
		queryClient.setQueryData( MANAGE_DATA_KEY, {
			isEnabled: true,
			isAgencyAccount: false,
			isDismissed: false,
		} );

		const { result } = renderHook( () => useDismissA4ABanner(), { wrapper } );

		result.current.dismiss();

		await waitFor( () =>
			expect( queryClient.getQueryData( MANAGE_DATA_KEY ) ).toEqual( {
				isEnabled: true,
				isAgencyAccount: false,
				isDismissed: true,
			} )
		);
	} );

	it( 'leaves an unfetched jetpack-manage cache entry alone', async () => {
		mockApiFetch.mockResolvedValue( { success: true } );

		const wrapper = createWrapper();
		const { result } = renderHook( () => useDismissA4ABanner(), { wrapper } );

		result.current.dismiss();

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( queryClient.getQueryData( MANAGE_DATA_KEY ) ).toBeUndefined();
	} );
} );
