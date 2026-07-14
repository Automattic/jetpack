import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useRef } from '@wordpress/element';
import { isSimpleSite } from '../utils/is-simple';
import {
	LIBRARY_ITEM_QUERY_SEGMENT,
	LIBRARY_QUERY_KEY,
	nextProcessingPoll,
	toLibraryItem,
} from './use-library';
import type { ApiMediaItem, ProcessingPollAnchor } from './use-library';
import type { LibraryItem } from '../types/library';

/**
 * Fetch and cache a single VideoPress media item from /wp/v2/media/{id}.
 *
 * Maps the response with the same toLibraryItem the library list uses, so the
 * detail view and the grid can never disagree about an item's shape.
 *
 * @param id - The numeric or string media post ID to fetch.
 * @return An object with the video item, loading/error state, and the raw error.
 */
export function useVideo( id: number | string ) {
	// VIDP-298 poll-cap anchor — same machinery as useLibrary, over one item.
	const processingStartRef = useRef< ProcessingPollAnchor | null >( null );

	const query = useQuery< LibraryItem >( {
		queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( id ) ],
		queryFn: async () => {
			const raw = await apiFetch< ApiMediaItem >( { path: `/wp/v2/media/${ id }` } );
			return toLibraryItem( raw, isSimpleSite() );
		},
		enabled: Boolean( id ),
		// Re-fetch every 2s while the backend is still processing this video so
		// the poster / duration appear without a manual reload — capped like the
		// library list so a stuck record can't poll forever (VIDP-298).
		refetchInterval: q => {
			const { anchor, interval } = nextProcessingPoll(
				processingStartRef.current,
				q.queryHash,
				q.state.data?.isProcessing ? [ String( id ) ] : [],
				Date.now()
			);
			processingStartRef.current = anchor;
			return interval;
		},
		// Recovery path once the cap has fired: a longer-than-cap transcode
		// flips to ready on the next tab focus (globally this is disabled).
		refetchOnWindowFocus: q => Boolean( q.state.data?.isProcessing ),
	} );

	return {
		video: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

/**
 * Returns a callback that invalidates a single video's cached query so the next
 * read refetches it. Lets any component refresh a video after mutating it
 * out-of-band (e.g. the caption manager) without threading `refetch` through props.
 *
 * @return A function that invalidates the cache for the given media ID.
 */
export function useInvalidateVideo() {
	const client = useQueryClient();
	return useCallback(
		( id: number | string ) =>
			client.invalidateQueries( {
				queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( id ) ],
			} ),
		[ client ]
	);
}
