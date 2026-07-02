/**
 * Filmstrip data for the Studio editor timeline.
 *
 * Resolution order: GET /wpcom/v2/videopress/{guid}/storyboard first — a
 * server-generated tile sprite (the local mock always 404s today; the shape
 * is future-proofed in types/edits.ts). Client-side extraction second — a
 * hidden <video> on the (token-signed when private) sourceUrl is seeked
 * sequentially through evenly spaced midpoints; each frame is drawn onto one
 * reused small canvas, encoded to a JPEG blob, and kept as an object URL.
 * Anything failing along the way (no playable source, media error,
 * CORS-tainted canvas) resolves to { status: 'unavailable' } — never a
 * thrown error — and the timeline keeps its neutral placeholder.
 *
 * Results are cached per guid with staleTime Infinity, so the strip survives
 * remounts for the whole session. Extraction frames' object URLs are revoked
 * when their cache entry is dropped; a partial extraction cancelled by
 * unmount revokes whatever it had grabbed and caches nothing.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useEffect } from 'react';
import { usePlaybackToken } from './use-poster-url';
import { createVideoFrameGrabber } from './video-frame-grabber';
import type { FrameGrabber } from './video-frame-grabber';
import type { Storyboard } from '../types/edits';
import type { LibraryItem } from '../types/library';
import type { QueryClient } from '@tanstack/react-query';

export type { FrameGrabber } from './video-frame-grabber';

/** Root query key for the per-video filmstrip. */
export const FILMSTRIP_QUERY_KEY = 'vp-filmstrip';

/** Upper bound on extracted frames (one per second below this). */
export const MAX_FILMSTRIP_FRAMES = 60;

/**
 * A resolved filmstrip: a server storyboard sprite, client-extracted frame
 * object URLs, or nothing usable.
 */
export type Filmstrip =
	| { status: 'storyboard'; storyboard: Storyboard }
	| { status: 'frames'; frames: string[] }
	| { status: 'unavailable' };

/** What the hook exposes: a resolved filmstrip or the pending state. */
export type FilmstripState = Filmstrip | { status: 'loading' };

const UNAVAILABLE: Filmstrip = { status: 'unavailable' };
const LOADING: FilmstripState = { status: 'loading' };

/**
 * Pick the frame times for a client-side extraction: the midpoints of
 * `min(MAX_FILMSTRIP_FRAMES, ceil(seconds))` equal slices of the duration,
 * so each tile shows the middle of the span it represents.
 *
 * @param durationMs - Master duration in ms.
 * @return Integer frame times in ascending (playback) order.
 */
export function pickFrameTimes( durationMs: number ): number[] {
	const count = Math.min( MAX_FILMSTRIP_FRAMES, Math.max( 1, Math.ceil( durationMs / 1000 ) ) );
	return Array.from( { length: count }, ( _, index ) =>
		Math.round( ( ( index + 0.5 ) * durationMs ) / count )
	);
}

/**
 * Revoke a list of frame object URLs.
 *
 * @param frames - Object URLs to revoke.
 */
function revokeFrames( frames: string[] ): void {
	frames.forEach( frame => URL.revokeObjectURL( frame ) );
}

/**
 * Run a full extraction against a grabber: load the media, then grab every
 * requested time sequentially (earliest first — the strip fills left to
 * right). Returns null — after revoking any partial frames — when the
 * grabber fails at any step; re-throws only when `signal` aborted, so a
 * cancellation is never cached as 'unavailable'. The grabber is always
 * destroyed.
 *
 * @param grabber - The frame grabber.
 * @param timesMs - Frame times in ms, in the order they should be grabbed.
 * @param signal  - Optional cancellation signal (react-query's queryFn signal).
 * @return Object URLs in `timesMs` order, or null when extraction failed.
 */
export async function extractFilmstripFrames(
	grabber: FrameGrabber,
	timesMs: number[],
	signal?: AbortSignal
): Promise< string[] | null > {
	const throwIfAborted = () => {
		if ( signal?.aborted ) {
			throw signal.reason instanceof Error
				? signal.reason
				: new DOMException( 'The filmstrip extraction was cancelled.', 'AbortError' );
		}
	};
	const frames: string[] = [];
	try {
		throwIfAborted();
		await grabber.load();
		for ( const timeMs of timesMs ) {
			throwIfAborted();
			// Sequential on purpose: one shared <video> can only sit on one
			// seek position at a time.
			frames.push( await grabber.grabFrame( timeMs ) );
		}
		return frames;
	} catch ( error ) {
		revokeFrames( frames );
		if ( signal?.aborted ) {
			throw error;
		}
		return null;
	} finally {
		grabber.destroy();
	}
}

/**
 * Validate the storyboard response shape before trusting it — a malformed
 * body falls through to client-side extraction exactly like the 404 the
 * local mock returns today.
 *
 * @param value - The parsed response body.
 * @return Whether the value is a renderable Storyboard.
 */
function isStoryboard( value: unknown ): value is Storyboard {
	if ( typeof value !== 'object' || value === null ) {
		return false;
	}
	const storyboard = value as Partial< Storyboard >;
	return (
		typeof storyboard.url === 'string' &&
		storyboard.url !== '' &&
		[
			storyboard.tile_width,
			storyboard.tile_height,
			storyboard.tiles,
			storyboard.columns,
			storyboard.interval_ms,
		].every( field => typeof field === 'number' && field > 0 )
	);
}

// QueryClients that already carry the filmstrip cache-drop revoker.
const revokerAttached = new WeakSet< QueryClient >();

/**
 * Attach a query-cache listener (once per client) that revokes extraction
 * frames' object URLs when their cache entry is dropped. Cleanup must key
 * off the cache rather than a hook effect: with staleTime Infinity the data
 * outlives any single component's mount. The subscription intentionally
 * lives for the client's lifetime.
 *
 * @param client - The query client to guard.
 */
function attachRevokeOnCacheDrop( client: QueryClient ): void {
	if ( revokerAttached.has( client ) ) {
		return;
	}
	revokerAttached.add( client );
	client.getQueryCache().subscribe( event => {
		if ( event.type !== 'removed' || event.query.queryKey[ 0 ] !== FILMSTRIP_QUERY_KEY ) {
			return;
		}
		const data = event.query.state.data as Filmstrip | undefined;
		if ( data?.status === 'frames' ) {
			revokeFrames( data.frames );
		}
	} );
}

export type UseFilmstripOptions = {
	/** Frame-grabber factory; injectable for tests (jsdom media is inert). */
	createGrabber?: ( src: string ) => FrameGrabber;
};

/**
 * Resolve filmstrip data for a video: server storyboard first, client-side
 * frame extraction as the fallback, 'unavailable' when neither works. Never
 * surfaces an error — the worst case is a cached 'unavailable' and the
 * timeline's neutral placeholder.
 *
 * Private videos wait for a playback JWT before touching the network; while
 * the token (or the strip itself) is pending the state is 'loading'.
 *
 * @param video   - The video whose filmstrip is needed.
 * @param options - Optional overrides (test seam).
 * @return The filmstrip state.
 */
export function useFilmstrip(
	video: LibraryItem,
	options: UseFilmstripOptions = {}
): FilmstripState {
	const { guid, sourceUrl, isPrivate, durationSeconds } = video;
	const token = usePlaybackToken( guid, isPrivate );
	const queryClient = useQueryClient();
	const { createGrabber = createVideoFrameGrabber } = options;

	useEffect( () => attachRevokeOnCacheDrop( queryClient ), [ queryClient ] );

	// eslint-disable-next-line @tanstack/query/exhaustive-deps -- the guid fully identifies the filmstrip; source URL, token, and duration are transport details of the same video and must not fork or refetch the cached strip.
	const query = useQuery< Filmstrip >( {
		queryKey: [ FILMSTRIP_QUERY_KEY, guid ],
		// Private sources 403 without the playback JWT; wait for it. Consuming
		// `signal` below also makes the query cancellable on unmount.
		enabled: Boolean( guid ) && ( ! isPrivate || Boolean( token ) ),
		staleTime: Infinity,
		retry: false,
		queryFn: async ( { signal } ) => {
			try {
				const storyboard = await apiFetch< unknown >( {
					path: `/wpcom/v2/videopress/${ guid }/storyboard`,
					signal,
				} );
				if ( isStoryboard( storyboard ) ) {
					return { status: 'storyboard', storyboard };
				}
			} catch {
				// 404 today (storyboard_unavailable); any failure falls through
				// to extraction.
			}

			if ( ! sourceUrl ) {
				return UNAVAILABLE;
			}
			const durationMs = Math.round( durationSeconds * 1000 );
			if ( durationMs <= 0 ) {
				return UNAVAILABLE;
			}
			const src = isPrivate ? `${ sourceUrl }?metadata_token=${ token }` : sourceUrl;
			const frames = await extractFilmstripFrames(
				createGrabber( src ),
				pickFrameTimes( durationMs ),
				signal
			);
			return frames ? { status: 'frames', frames } : UNAVAILABLE;
		},
	} );

	if ( query.data ) {
		return query.data;
	}
	// The queryFn only throws on cancellation, but any error still means "no
	// strip", never a broken editor.
	return query.isError ? UNAVAILABLE : LOADING;
}
