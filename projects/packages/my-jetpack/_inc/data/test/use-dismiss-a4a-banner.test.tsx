import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useDismissA4ABanner from '../use-dismiss-a4a-banner';
import type { FC, ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as unknown as jest.MockedFunction< typeof apiFetch >;

const createWrapper = (): FC< { children: ReactNode } > => {
	const queryClient = new QueryClient( {
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
} );
