import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type {
	PlaylistCreate,
	PlaylistDeleteResult,
	PlaylistItem,
	PlaylistPatch,
} from '../types/playlists';
import type { View } from '@wordpress/dataviews';

const REST_PATH = '/jetpack/v4/videopress/playlists';

export const PLAYLISTS_QUERY_KEY = 'jetpack-videopress-playlists' as const;

// DataViews field id → the route's `orderby` value.
const SORT_FIELD_MAP: Record< string, string > = {
	title: 'title',
	updated: 'updated',
	videoCount: 'videos',
};

/**
 * Convert a DataViews View into query args for the playlists route.
 *
 * @param view - The current DataViews view.
 * @return Query args for addQueryArgs.
 */
export function viewToPlaylistQueryArgs(
	view: View
): Record< string, string | number | string[] > {
	const args: Record< string, string | number | string[] > = {
		page: view.page ?? 1,
		per_page: view.perPage ?? 12,
	};

	const orderby = view.sort?.field ? SORT_FIELD_MAP[ view.sort.field ] : undefined;
	if ( orderby ) {
		args.orderby = orderby;
		args.order = view.sort?.direction ?? 'desc';
	}

	const search = view.search?.trim();
	if ( search ) {
		args.search = search;
	}

	const statusFilter = view.filters?.find( filter => filter.field === 'status' );
	const statuses = ( [] as unknown[] )
		.concat( statusFilter?.value ?? [] )
		.filter( ( value ): value is string => typeof value === 'string' && value !== '' );
	if ( statuses.length ) {
		args.status = statuses;
	}

	return args;
}

/**
 * Fetch a page of the site's playlists.
 *
 * @param view - The current DataViews view (sort, search, filters, pagination).
 * @return Items, pagination info, and query state.
 */
export function usePlaylists( view: View ) {
	const args = viewToPlaylistQueryArgs( view );
	const query = useQuery( {
		queryKey: [ PLAYLISTS_QUERY_KEY, 'list', args ],
		queryFn: async () => {
			const response = ( await apiFetch( {
				path: addQueryArgs( REST_PATH, args ),
				parse: false,
			} ) ) as Response;
			return {
				items: ( await response.json() ) as PlaylistItem[],
				paginationInfo: {
					totalItems: Number( response.headers.get( 'X-WP-Total' ) ?? 0 ),
					totalPages: Number( response.headers.get( 'X-WP-TotalPages' ) ?? 0 ),
				},
			};
		},
		placeholderData: keepPreviousData,
	} );

	return {
		items: query.data?.items ?? [],
		paginationInfo: query.data?.paginationInfo ?? { totalItems: 0, totalPages: 0 },
		isLoading: query.isLoading,
		isFetching: query.isFetching,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

/**
 * Fetch one playlist.
 *
 * @param key - The playlist key.
 * @return The TanStack query.
 */
export function usePlaylist( key: string ) {
	return useQuery< PlaylistItem >( {
		queryKey: [ PLAYLISTS_QUERY_KEY, 'item', key ],
		queryFn: () => apiFetch< PlaylistItem >( { path: `${ REST_PATH }/${ key }` } ),
		enabled: Boolean( key ),
		// A missing playlist is final; don't retry the 404.
		retry: false,
	} );
}

/**
 * Save changes to a playlist; the response refreshes its cached copy and the list.
 *
 * @return A TanStack mutation.
 */
export function useUpdatePlaylist() {
	const client = useQueryClient();

	return useMutation< PlaylistItem, Error, { key: string; patch: PlaylistPatch } >( {
		mutationFn: ( { key, patch } ) =>
			apiFetch< PlaylistItem >( {
				path: `${ REST_PATH }/${ key }`,
				method: 'POST',
				data: patch,
			} ),
		onSuccess: saved => {
			client.setQueryData( [ PLAYLISTS_QUERY_KEY, 'item', saved.key ], saved );
			client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY, 'list' ] } );
		},
	} );
}

/**
 * Create a playlist in a new post.
 *
 * @return A TanStack mutation resolving to the new playlist.
 */
export function useCreatePlaylist() {
	const client = useQueryClient();

	return useMutation< PlaylistItem, Error, PlaylistCreate >( {
		mutationFn: data =>
			apiFetch< PlaylistItem >( {
				path: REST_PATH,
				method: 'POST',
				data,
			} ),
		onSuccess: created => {
			client.setQueryData( [ PLAYLISTS_QUERY_KEY, 'item', created.key ], created );
			client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY, 'list' ] } );
		},
	} );
}

/**
 * Delete a playlist.
 *
 * @return A TanStack mutation taking the playlist key.
 */
export function useDeletePlaylist() {
	const client = useQueryClient();

	return useMutation< PlaylistDeleteResult, Error, string >( {
		mutationFn: key =>
			apiFetch< PlaylistDeleteResult >( {
				path: `${ REST_PATH }/${ key }`,
				method: 'DELETE',
			} ),
		onSuccess: ( _result, key ) => {
			client.removeQueries( { queryKey: [ PLAYLISTS_QUERY_KEY, 'item', key ] } );
			client.invalidateQueries( { queryKey: [ PLAYLISTS_QUERY_KEY, 'list' ] } );
		},
	} );
}
