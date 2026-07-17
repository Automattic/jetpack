import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_ITEM_QUERY_SEGMENT, LIBRARY_QUERY_KEY } from './use-library';

type Id = number | string;

/**
 * Thrown when one or more deletions in a batch fail. Carries the ids that
 * failed so callers can report precise counts and keep the surviving rows
 * selected; the other ids in the batch were deleted successfully.
 */
export class DeleteVideosError extends Error {
	failedIds: Id[];

	constructor( failedIds: Id[] ) {
		super( `Failed to delete ${ failedIds.length } video(s)` );
		this.name = 'DeleteVideosError';
		this.failedIds = failedIds;
	}
}

/**
 * Return a mutation that permanently deletes one or more videos via DELETE
 * /wp/v2/media/{id}?force=true. Requests run in parallel; if any fail the
 * mutation rejects with a DeleteVideosError listing the failed ids (the rest
 * stay deleted). The library cache is invalidated on settle — success and
 * partial failure both change the listing — and the invalidation promise is
 * returned so the mutation settles only after active queries refetch, letting
 * row-level "Deleting…" states persist until rows actually disappear.
 *
 * Callers should react via the mutateAsync promise rather than mutate-level
 * callbacks: TanStack detaches the observer from an in-flight mutation when
 * the same hook instance starts another one, silently dropping that call's
 * mutate-level callbacks — the promise always settles.
 *
 * @return A TanStack Query mutation object whose mutateAsync accepts a single id or an array of ids.
 */
export function useDeleteVideo() {
	const client = useQueryClient();
	return useMutation< void, Error, Id | Id[] >( {
		mutationFn: async input => {
			const ids = Array.isArray( input ) ? input : [ input ];
			const results = await Promise.allSettled(
				ids.map( id =>
					apiFetch( {
						path: `/wp/v2/media/${ id }?force=true`,
						method: 'DELETE',
					} )
				)
			);
			const failedIds = ids.filter( ( _, index ) => results[ index ].status === 'rejected' );
			if ( failedIds.length > 0 ) {
				throw new DeleteVideosError( failedIds );
			}
		},
		onSettled: ( _data, error, input ) => {
			// Drop the deleted ids' item-detail queries outright. Invalidating
			// them is no help — a refetch 404s and TanStack retains the stale
			// data — so a cached entry would let a back-navigation render a
			// ghost editor for a video that no longer exists.
			const ids = Array.isArray( input ) ? input : [ input ];
			const failedIds = error instanceof DeleteVideosError ? new Set( error.failedIds ) : null;
			ids
				.filter( id => ! failedIds?.has( id ) )
				.forEach( id =>
					client.removeQueries( {
						queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( id ) ],
					} )
				);
			// Predicate rather than a key prefix: plain [ LIBRARY_QUERY_KEY ]
			// would also match useVideo's item queries — on the details page
			// that query is active for the id being deleted, and the refetch
			// would 404 (+ one retry) and stall settling by seconds. Deleting
			// can't change other items' detail data, so item queries are
			// excluded entirely.
			return client.invalidateQueries( {
				predicate: query =>
					query.queryKey[ 0 ] === LIBRARY_QUERY_KEY &&
					query.queryKey[ 1 ] !== LIBRARY_ITEM_QUERY_SEGMENT,
			} );
		},
	} );
}
