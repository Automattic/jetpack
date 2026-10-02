import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { JETPACK_MANAGE_DATA_QUERY } from '../constants';
import useDismissA4ABanner from '../use-dismiss-a4a-banner';
import { getSimpleQueryKey } from '../use-simple-query';
import type { FC, ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as unknown as jest.MockedFunction< typeof apiFetch >;

const MANAGE_DATA_KEY = getSimpleQueryKey( JETPACK_MANAGE_DATA_QUERY );

const NOT_DISMISSED = { isEnabled: true, isAgencyAccount: false, isDismissed: false };

const createClient = () => new QueryClient( { defaultOptions: { mutations: { retry: false } } } );

const wrapperFor =
	( client: QueryClient ): FC< { children: ReactNode } > =>
	( { children } ) => <QueryClientProvider client={ client }>{ children }</QueryClientProvider>;

describe( 'useDismissA4ABanner', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'starts not pending', () => {
		const { result } = renderHook( () => useDismissA4ABanner(), {
			wrapper: wrapperFor( createClient() ),
		} );

		expect( result.current.isPending ).toBe( false );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'POSTs to the dismissal endpoint', async () => {
		mockApiFetch.mockResolvedValue( { success: true } );

		const { result } = renderHook( () => useDismissA4ABanner(), {
			wrapper: wrapperFor( createClient() ),
		} );

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

		const { result } = renderHook( () => useDismissA4ABanner(), {
			wrapper: wrapperFor( createClient() ),
		} );

		result.current.dismiss();

		await waitFor( () => expect( result.current.isPending ).toBe( true ) );

		resolveFetch( { success: true } );

		await waitFor( () => expect( result.current.isPending ).toBe( false ) );
	} );

	it( 'marks the cached jetpack-manage payload dismissed, so a remount does not re-show the banner', async () => {
		mockApiFetch.mockResolvedValue( { success: true } );

		const client = createClient();
		client.setQueryData( MANAGE_DATA_KEY, NOT_DISMISSED );

		const { result } = renderHook( () => useDismissA4ABanner(), {
			wrapper: wrapperFor( client ),
		} );

		result.current.dismiss();

		await waitFor( () =>
			expect( client.getQueryData( MANAGE_DATA_KEY ) ).toEqual( {
				...NOT_DISMISSED,
				isDismissed: true,
			} )
		);
	} );

	it( 'puts the cached payload back when the request fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		const client = createClient();
		client.setQueryData( MANAGE_DATA_KEY, NOT_DISMISSED );

		const { result } = renderHook( () => useDismissA4ABanner(), {
			wrapper: wrapperFor( client ),
		} );

		result.current.dismiss();

		await waitFor( () => expect( result.current.isPending ).toBe( false ) );
		expect( client.getQueryData( MANAGE_DATA_KEY ) ).toEqual( NOT_DISMISSED );
	} );

	it( 'leaves an unfetched jetpack-manage cache entry alone', async () => {
		mockApiFetch.mockResolvedValue( { success: true } );

		const client = createClient();
		const { result } = renderHook( () => useDismissA4ABanner(), {
			wrapper: wrapperFor( client ),
		} );

		result.current.dismiss();

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		expect( client.getQueryData( MANAGE_DATA_KEY ) ).toBeUndefined();
	} );
} );
