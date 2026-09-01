import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { DeleteVideosError, useDeleteVideo } from '../use-delete-video';

describe( 'useDeleteVideo', () => {
	it( 'sends DELETE for each id', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path, method } ) => {
			if ( method === 'DELETE' ) {
				paths.push( path ?? '' );
				return { deleted: true };
			}
			throw new Error( 'unexpected' );
		} );

		const client = createTestQueryClient();
		const removeSpy = jest.spyOn( client, 'removeQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( [ 1, 2, 3 ] );
		} );

		expect( paths ).toEqual( [
			'/wp/v2/media/1?force=true',
			'/wp/v2/media/2?force=true',
			'/wp/v2/media/3?force=true',
		] );
		// Deleted ids' item-detail queries are dropped so a back-navigation
		// can't render a ghost editor from cache.
		expect( removeSpy ).toHaveBeenCalledTimes( 3 );
		expect( removeSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-library', 'item', '2' ],
		} );
	} );

	it( 'rejects with a DeleteVideosError listing only the failed ids, still attempting every id', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path, method } ) => {
			if ( method === 'DELETE' ) {
				paths.push( path ?? '' );
				if ( path === '/wp/v2/media/2?force=true' ) {
					throw new Error( 'boom' );
				}
				return { deleted: true };
			}
			throw new Error( 'unexpected' );
		} );

		const client = createTestQueryClient();
		const removeSpy = jest.spyOn( client, 'removeQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );

		let caught: unknown;
		await act( async () => {
			try {
				await result.current.mutateAsync( [ 1, 2, 3 ] );
			} catch ( error ) {
				caught = error;
			}
		} );

		expect( caught ).toBeInstanceOf( DeleteVideosError );
		expect( ( caught as DeleteVideosError ).failedIds ).toEqual( [ 2 ] );
		// A failure must not short-circuit the rest of the batch.
		expect( paths ).toHaveLength( 3 );
		// Only the SUCCEEDED ids' item queries are dropped — the failed row
		// still exists and its cached details remain valid.
		expect( removeSpy ).toHaveBeenCalledTimes( 2 );
		expect( removeSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-library', 'item', '1' ],
		} );
		expect( removeSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-library', 'item', '3' ],
		} );
	} );

	it( 'invalidates library list queries (not item queries) even when deletions fail', async () => {
		mockApiFetch( async ( { method } ) => {
			if ( method === 'DELETE' ) {
				throw new Error( 'boom' );
			}
			throw new Error( 'unexpected' );
		} );

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( 1 ).catch( () => {
				// Rejection is expected; the assertion below is about invalidation.
			} );
		} );

		expect( invalidateSpy ).toHaveBeenCalledTimes( 1 );
		const { predicate } = invalidateSpy.mock.calls[ 0 ][ 0 ] as unknown as {
			predicate: ( query: { queryKey: unknown[] } ) => boolean;
		};
		// List queries refetch; the (possibly just-deleted) item query must
		// not — refetching it would 404 and stall the mutation settling.
		expect( predicate( { queryKey: [ 'jetpack-videopress-library', { page: 1 } ] } ) ).toBe( true );
		expect( predicate( { queryKey: [ 'jetpack-videopress-library', 'item', '9' ] } ) ).toBe(
			false
		);
		expect( predicate( { queryKey: [ 'unrelated' ] } ) ).toBe( false );
	} );
} );
