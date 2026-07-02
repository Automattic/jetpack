import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_QUERY_KEY } from './use-library';
import { PLAYLISTS_QUERY_KEY, PLAYLISTS_REST_PATH } from './use-playlists';
import type { LibraryItem } from '../types/library';
import type { Playlist } from '../types/playlist';

type Id = number | string;

export type SetPlaylistsVars = {
	/** The attachments to add; playlistIds seed each new term list. */
	items: Pick< LibraryItem, 'id' | 'playlistIds' >[];
	/** The playlists to add every item to; order seeds the meta append. */
	playlists: Pick< Playlist, 'id' | 'order' >[];
};

export type SetPlaylistsResult = {
	succeeded: Id[];
	failed: { id: Id; message: string }[];
};

/**
 * Return a mutation that adds one or more videos to one or more playlists.
 *
 * Membership first: each attachment is POSTed to /wp/v2/media/{id} with its
 * merged `videopress-playlists` term list — the arg replaces the relationship
 * set, so the chosen playlist IDs are unioned with what's already assigned.
 * Requests run in parallel (matching useSetPrivacy) and a failure on one video
 * doesn't abort the rest; the result reports which ids succeeded and which
 * failed so the caller can surface a partial-failure notice.
 *
 * Then presentation: each chosen playlist gets a single meta POST appending
 * the newly-added attachment IDs to its `vps_playlist_order`. Failures here
 * are deliberately swallowed — order is presentation-only and the detail
 * screen's resolveOrderedIds() appends order-less members on its own.
 *
 * The library and playlists caches are invalidated once on settle so both
 * listings reflect whatever did change.
 *
 * @return A TanStack Query mutation whose mutateAsync accepts `{ items, playlists }`.
 */
export function useSetPlaylists() {
	const client = useQueryClient();
	return useMutation< SetPlaylistsResult, Error, SetPlaylistsVars >( {
		mutationFn: async ( { items, playlists } ) => {
			const playlistIds = playlists.map( playlist => playlist.id );
			const results = await Promise.allSettled(
				items.map( item =>
					apiFetch( {
						path: `/wp/v2/media/${ item.id }`,
						method: 'POST',
						data: {
							'videopress-playlists': [ ...new Set( [ ...item.playlistIds, ...playlistIds ] ) ],
						},
					} )
				)
			);

			const succeeded: Id[] = [];
			const failed: { id: Id; message: string }[] = [];
			results.forEach( ( result, index ) => {
				const { id } = items[ index ];
				if ( result.status === 'fulfilled' ) {
					succeeded.push( id );
					return;
				}
				const { reason } = result;
				const message =
					reason instanceof Error
						? reason.message
						: ( reason as { message?: string } )?.message ?? String( reason );
				failed.push( { id, message } );
			} );

			const succeededIds = new Set( succeeded.map( String ) );
			await Promise.allSettled(
				playlists.map( playlist => {
					// Only items whose membership write landed and that weren't
					// already in this playlist count as newly added; anything
					// already present in the stored order is skipped too so a
					// repeat add can't duplicate an entry.
					const added = items
						.filter(
							item =>
								succeededIds.has( String( item.id ) ) && ! item.playlistIds.includes( playlist.id )
						)
						.map( item => Number( item.id ) )
						.filter( id => ! playlist.order.includes( id ) );
					if ( added.length === 0 ) {
						return Promise.resolve();
					}
					return apiFetch( {
						path: `${ PLAYLISTS_REST_PATH }/${ playlist.id }`,
						method: 'POST',
						data: { meta: { vps_playlist_order: [ ...playlist.order, ...added ] } },
					} );
				} )
			);

			return { succeeded, failed };
		},
		onSettled: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY ] } );
		},
	} );
}
