import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { LIBRARY_QUERY_KEY } from '../use-library';
import { useUpdateVideoPoster } from '../use-update-video-poster';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Create an isolated QueryClient, a spy on its invalidateQueries method, and a
 * React wrapper component for renderHook.
 *
 * @return An object containing the wrapper component and the invalidateSpy.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { wrapper, invalidateSpy };
}

describe( 'useUpdateVideoPoster', () => {
	beforeEach( () => {
		mockedApiFetch.mockReset();
	} );

	it( 'sends frame-mode POST body to the guid-scoped poster endpoint', async () => {
		mockedApiFetch.mockResolvedValueOnce( {} );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 4200,
			} );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/poster',
			method: 'POST',
			data: { at_time: 4200, is_millisec: true },
		} );
	} );

	it( 'sends attachment-mode POST body', async () => {
		mockedApiFetch.mockResolvedValueOnce( {} );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'attachment',
				attachmentId: 17,
			} );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/poster',
			method: 'POST',
			data: { poster_attachment_id: 17 },
		} );
	} );

	it( 'invalidates the library and item query keys on success', async () => {
		mockedApiFetch.mockResolvedValueOnce( {} );
		const { wrapper, invalidateSpy } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				id: '42',
				guid: 'abc123',
				source: 'frame',
				atTimeMs: 1000,
			} );
		} );

		await waitFor( () => expect( result.current.isSuccess ).toBe( true ) );

		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ LIBRARY_QUERY_KEY ],
		} );
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ LIBRARY_QUERY_KEY, 'item', '42' ],
		} );
	} );

	it( 'does not invalidate on API error', async () => {
		mockedApiFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		const { wrapper, invalidateSpy } = makeWrapper();
		const { result } = renderHook( () => useUpdateVideoPoster(), { wrapper } );

		await act( async () => {
			await expect(
				result.current.mutateAsync( {
					id: '42',
					guid: 'abc123',
					source: 'frame',
					atTimeMs: 1000,
				} )
			).rejects.toThrow( 'boom' );
		} );

		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );
} );
