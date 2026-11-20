import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import {
	useCreatePlaylist,
	useDeletePlaylist,
	usePlaylist,
	usePlaylists,
	useUpdatePlaylist,
} from '../use-playlists';
import type { View } from '@wordpress/dataviews';
import type { ReactNode } from 'react';

let client: QueryClient;
const wrapper = ( { children }: { children: ReactNode } ) => (
	<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
);

const VIEW: View = { type: 'grid', page: 1, perPage: 12, filters: [], search: '' };

describe( 'playlist queries', () => {
	beforeEach( () => {
		client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	} );

	it( 'lists a page with the totals from the headers', async () => {
		const api = mockApiFetch( async () => ( {
			json: async () => [ { key: 'a' } ],
			headers: new Map( [
				[ 'X-WP-Total', '13' ],
				[ 'X-WP-TotalPages', '2' ],
			] ),
		} ) );
		const { result } = renderHook( () => usePlaylists( VIEW ), { wrapper } );

		await waitFor( () => expect( result.current.items ).toEqual( [ { key: 'a' } ] ) );
		expect( result.current.paginationInfo ).toEqual( { totalItems: 13, totalPages: 2 } );
		expect( api.mock.calls[ 0 ][ 0 ] ).toMatchObject( { parse: false } );
	} );

	it( 'reads, updates, creates and deletes playlists', async () => {
		const api = mockApiFetch( async ( { method, path, data } ) => {
			if ( method === 'DELETE' ) {
				return { deleted: true };
			}
			if ( method === 'POST' ) {
				return { key: path?.endsWith( 'playlists' ) ? 'new' : 'a', ...( data as object ) };
			}
			return { key: 'a', title: 'A' };
		} );

		const { result: one } = renderHook( () => usePlaylist( 'a' ), { wrapper } );
		await waitFor( () => expect( one.current.data ).toEqual( { key: 'a', title: 'A' } ) );

		const { result: update } = renderHook( () => useUpdatePlaylist(), { wrapper } );
		await act( () => update.current.mutateAsync( { key: 'a', patch: { title: 'B' } } ) );
		expect( client.getQueryData( [ 'jetpack-videopress-playlists', 'item', 'a' ] ) ).toEqual( {
			key: 'a',
			title: 'B',
		} );

		const { result: create } = renderHook( () => useCreatePlaylist(), { wrapper } );
		await act( () => create.current.mutateAsync( { title: 'New', postType: 'page' } ) );
		expect( api ).toHaveBeenCalledWith( {
			path: '/wpcom/v3/videopress/playlists',
			method: 'POST',
			data: { title: 'New', postType: 'page' },
		} );

		const { result: remove } = renderHook( () => useDeletePlaylist(), { wrapper } );
		await act( () => remove.current.mutateAsync( 'a' ) );
		expect( api ).toHaveBeenCalledWith( {
			path: '/wpcom/v3/videopress/playlists/a',
			method: 'DELETE',
		} );
		expect(
			client.getQueryData( [ 'jetpack-videopress-playlists', 'item', 'a' ] )
		).toBeUndefined();
	} );
} );
