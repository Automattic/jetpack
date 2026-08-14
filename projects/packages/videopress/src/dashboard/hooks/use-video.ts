import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useRef } from '@wordpress/element';
import {
	LIBRARY_ITEM_QUERY_SEGMENT,
	LIBRARY_QUERY_KEY,
	nextProcessingPoll,
	toLibraryItem,
} from './use-library';
import type { ApiMediaItem, ProcessingPollAnchor } from './use-library';
import type { LibraryItem } from '../types/library';

/**
 * Whether a fetched item still needs the 2s follow-up poll.
 *
 * Processing is the obvious case. The GUID-less case matters for fresh
 * uploads: the /wp/v2/media record can exist before WordPress.com has
 * registered the VideoPress video, and a GUID-less record maps to type
 * 'local' with `isProcessing` false — so a poll gated on `isProcessing`
 * alone would never notice the GUID arriving. A permanently-local
 * attachment does keep polling under this rule; the VIDP-298 cap bounds it.
 *
 * @param item - The fetched item, or undefined before the first response.
 * @return True when the item should keep being re-fetched.
 */
export function shouldPollVideo( item: LibraryItem | undefined ): boolean {
	return Boolean( item && ( item.isProcessing || ! item.guid ) );
}

/**
 * Whether a query error means the record is gone.
 *
 * WordPress answers a missing attachment with `rest_post_invalid_id` / HTTP
 * 404. apiFetch surfaces the REST body as the error object, so both shapes
 * are checked — a proxy or a non-REST failure can carry the status without
 * the code.
 *
 * @param error - The query's latest error.
 * @return True when the video no longer exists.
 */
export function isMissingVideoError( error: unknown ): boolean {
	if ( ! error || typeof error !== 'object' ) {
		return false;
	}
	const { code, data, status } = error as {
		code?: unknown;
		data?: { status?: unknown };
		status?: unknown;
	};
	return code === 'rest_post_invalid_id' || data?.status === 404 || status === 404;
}

/**
 * Decide a single video's poll interval, and advance the VIDP-298 cap anchor.
 *
 * Two things beyond the library list's rule. A deleted video 404s on every
 * poll: without stopping, an out-of-band delete leaves the stale row hammering
 * the endpoint until the cap fires. And registration (the record exists, the
 * VideoPress GUID does not) and transcoding are separate waits with wildly
 * different durations, so the anchor is keyed by phase rather than by id
 * alone — each gets its own PROCESSING_POLL_MAX_MS budget, and a slow
 * registration can't starve the transcode tail that follows it.
 *
 * Pure so the cap behavior is testable without wrangling react-query's timers.
 *
 * @param anchor - The previously stored anchor, or null.
 * @param id     - The media post ID being polled.
 * @param item   - The item currently in cache, if any.
 * @param error  - The query's latest error, if any.
 * @param now    - Current epoch ms.
 * @return The anchor to store and the poll interval (false stops polling).
 */
export function nextVideoPoll(
	anchor: ProcessingPollAnchor | null,
	id: number | string,
	item: LibraryItem | undefined,
	error: unknown,
	now: number
): { anchor: ProcessingPollAnchor | null; interval: number | false } {
	if ( isMissingVideoError( error ) ) {
		return { anchor: null, interval: false };
	}
	const phaseKeys = shouldPollVideo( item )
		? [ `${ id }:${ item?.guid ? 'transcode' : 'register' }` ]
		: [];
	return nextProcessingPoll( anchor, phaseKeys, now );
}

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
		// Re-fetch every 2s while the backend is still working on this video —
		// transcoding, or not yet holding a GUID (see shouldPollVideo) — so the
		// poster / duration / GUID appear without a manual reload. Capped per
		// phase so a stuck record can't poll forever (VIDP-298), and stopped
		// outright once the record 404s; see nextVideoPoll.
		refetchInterval: q => {
			const { anchor, interval } = nextVideoPoll(
				processingStartRef.current,
				id,
				q.state.data,
				q.state.error,
				Date.now()
			);
			processingStartRef.current = anchor;
			return interval;
		},
		// Recovery path once the cap has fired: a longer-than-cap transcode
		// flips to ready on the next tab focus (globally this is disabled).
		refetchOnWindowFocus: q => shouldPollVideo( q.state.data ),
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
