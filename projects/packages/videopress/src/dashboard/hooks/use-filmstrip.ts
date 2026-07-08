/**
 * Filmstrip data for the Studio editor timeline.
 *
 * Resolution order: GET /wpcom/v2/videopress/{guid}/storyboard first — a
 * server-generated tile sprite (the local mock always 404s today; the shape
 * is future-proofed in types/edits.ts). Client-side extraction second — a
 * per-video frame-extraction pool (frame-extraction-pool.ts) seeks a hidden
 * <video> on the (token-signed when private) sourceUrl through evenly spaced
 * midpoints, one seek at a time; each frame is drawn onto one reused small
 * canvas, encoded to a JPEG blob, and kept as an object URL. Anything
 * failing along the way (no playable source, media error, CORS-tainted
 * canvas, hung seeks) resolves to { status: 'unavailable' } — never a thrown
 * error — and the timeline keeps its neutral placeholder.
 *
 * Ownership: the pool lives for the hook's lifetime (destroyed on unmount or
 * guid change, revoking whatever it still holds). A COMPLETED batch is
 * detached from the pool and handed to the react-query cache — cached per
 * guid with staleTime Infinity, so the strip survives remounts for the whole
 * session; those object URLs are revoked when their cache entry is dropped.
 * A partial extraction cancelled by unmount caches nothing and its frames
 * die with the pool.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef, useState } from 'react';
import { createFrameExtractionPool } from './frame-extraction-pool';
import { usePlaybackToken } from './use-poster-url';
import { createVideoFrameGrabber } from './video-frame-grabber';
import type { FrameExtractionPool } from './frame-extraction-pool';
import type { FrameGrabber } from './video-frame-grabber';
import type { Storyboard } from '../types/edits';
import type { LibraryItem } from '../types/library';
import type { QueryClient } from '@tanstack/react-query';

export type { FrameGrabber } from './video-frame-grabber';
export { createFrameExtractionPool } from './frame-extraction-pool';
export type {
	FrameExtractionPool,
	FrameExtractionPoolOptions,
	FrameSlot,
} from './frame-extraction-pool';

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
 * Throw the abort reason (or a fresh AbortError) when the signal is aborted.
 *
 * @param signal - The cancellation signal, if any.
 */
function throwIfAborted( signal?: AbortSignal ): void {
	if ( signal?.aborted ) {
		throw signal.reason instanceof Error
			? signal.reason
			: new DOMException( 'The filmstrip extraction was cancelled.', 'AbortError' );
	}
}

/**
 * Run a full batch extraction against a pool: request every time (the pool
 * seeks strictly sequentially, earliest first — the strip fills left to
 * right) and wait for all of them to settle. On full success the URLs are
 * DETACHED from the pool — ownership passes to the caller (the react-query
 * cache and its drop listener). Resolves null when any frame fails,
 * cancelling whatever is still queued; partial frames stay pooled and die
 * with the pool. Rejects only when `signal` aborts, so a cancellation is
 * never cached as 'unavailable'.
 *
 * @param pool    - The frame-extraction pool.
 * @param timesMs - Frame times in ms, in the order they should be grabbed.
 * @param signal  - Optional cancellation signal (react-query's queryFn signal).
 * @return Object URLs in `timesMs` order, or null when extraction failed.
 */
export async function extractFilmstripFrames(
	pool: FrameExtractionPool,
	timesMs: number[],
	signal?: AbortSignal
): Promise< string[] | null > {
	throwIfAborted( signal );

	return new Promise< string[] | null >( ( resolve, reject ) => {
		let settled = false;
		let unsubscribe = () => {};
		const finish = () => {
			settled = true;
			unsubscribe();
			signal?.removeEventListener( 'abort', onAbort );
		};
		const pendingTimes = () => {
			const pending: number[] = [];
			pool.peekFrames( timesMs ).forEach( ( slot, ms ) => {
				if ( slot.status === 'pending' ) {
					pending.push( ms );
				}
			} );
			return pending;
		};
		const onAbort = () => {
			if ( settled ) {
				return;
			}
			// Stop seeking times nobody will consume; frames already grabbed
			// stay pooled and are revoked when the pool is destroyed.
			pool.cancelFrames( pendingTimes() );
			finish();
			try {
				throwIfAborted( signal );
			} catch ( error ) {
				reject( error );
			}
		};
		const check = () => {
			if ( settled ) {
				return;
			}
			const slots = pool.peekFrames( timesMs );
			const pending: number[] = [];
			let failed = false;
			slots.forEach( ( slot, ms ) => {
				if ( slot.status === 'pending' ) {
					pending.push( ms );
				} else if ( slot.status === 'failed' ) {
					failed = true;
				}
			} );
			if ( failed ) {
				pool.cancelFrames( pending );
				finish();
				resolve( null );
				return;
			}
			if ( pending.length === 0 ) {
				finish();
				resolve( pool.takeFrames( timesMs ) );
			}
		};
		unsubscribe = pool.subscribe( check );
		signal?.addEventListener( 'abort', onAbort );
		pool.requestFrames( timesMs );
		check();
	} );
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
 * A standing frame-extraction pool for a video, for consumers that grab
 * frames on demand rather than in one batch — the timeline filmstrip's
 * densified zoom stops. Distinct from useFilmstrip's internal batch pool on
 * purpose: in storyboard mode (the only mode that densifies) that pool is
 * never created, and the batch path's take-and-detach ownership would fight
 * an incremental consumer.
 *
 * The pool object is cheap — its grabber (and hidden <video>) only exists
 * once the first frame is requested — so it is created as soon as a usable
 * source is known and destroyed (revoking every cached frame) on unmount or
 * when the video/source changes. Private videos wait for the playback JWT;
 * until then (or with no usable source at all) the hook returns null and
 * callers simply don't extract.
 *
 * @param video   - The video to extract frames from.
 * @param options - Optional overrides (test seam).
 * @return The pool, or null while there is no usable source.
 */
export function useFrameExtractionPool(
	video: LibraryItem,
	options: UseFilmstripOptions = {}
): FrameExtractionPool | null {
	// Prefer the transcoded H.264 rendition, exactly like the batch path: the
	// original upload may be an HEVC .mov the browser can't decode.
	const { guid, isPrivate } = video;
	const sourceUrl = video.playbackUrl ?? video.sourceUrl;
	const token = usePlaybackToken( guid, isPrivate );
	const { createGrabber = createVideoFrameGrabber } = options;
	const createGrabberRef = useRef( createGrabber );
	createGrabberRef.current = createGrabber;

	let src: string | null = null;
	if ( sourceUrl && Boolean( guid ) ) {
		if ( ! isPrivate ) {
			src = sourceUrl;
		} else if ( token ) {
			src = `${ sourceUrl }?metadata_token=${ token }`;
		}
	}

	// The pool flows through state (not a ref) so consumers' effects re-run
	// when it appears — e.g. a private video's pool arriving after the JWT.
	const [ pool, setPool ] = useState< FrameExtractionPool | null >( null );
	useEffect( () => {
		if ( ! src ) {
			setPool( null );
			return;
		}
		const next = createFrameExtractionPool( {
			createGrabber: () => createGrabberRef.current( src ),
		} );
		setPool( next );
		return () => {
			next.destroy();
		};
	}, [ guid, src ] );

	return pool;
}

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
	// Prefer the transcoded H.264 rendition for frame extraction: the original
	// upload may be an HEVC .mov the browser can't decode.
	const { guid, isPrivate, durationSeconds } = video;
	const sourceUrl = video.playbackUrl ?? video.sourceUrl;
	const token = usePlaybackToken( guid, isPrivate );
	const queryClient = useQueryClient();
	const { createGrabber = createVideoFrameGrabber } = options;

	useEffect( () => attachRevokeOnCacheDrop( queryClient ), [ queryClient ] );

	// One extraction pool (and thus one hidden <video>) per mounted hook,
	// created lazily by the first extraction and destroyed — revoking every
	// frame it still owns — on unmount or guid change.
	const poolRef = useRef< { guid: string; pool: FrameExtractionPool } | null >( null );
	useEffect( () => {
		return () => {
			poolRef.current?.pool.destroy();
			poolRef.current = null;
		};
	}, [ guid ] );

	/**
	 * Return this video's pool, creating it on first use. Only reachable from
	 * a live queryFn (stale ones throw on their aborted signal first), so a
	 * ref entry for another guid is a leftover the cleanup effect is about to
	 * drop anyway — replace it defensively.
	 *
	 * @param src - The (token-signed when private) extraction source URL.
	 * @return The pool.
	 */
	const getPool = ( src: string ): FrameExtractionPool => {
		if ( poolRef.current && poolRef.current.guid !== guid ) {
			poolRef.current.pool.destroy();
			poolRef.current = null;
		}
		if ( ! poolRef.current ) {
			poolRef.current = {
				guid,
				pool: createFrameExtractionPool( { createGrabber: () => createGrabber( src ) } ),
			};
		}
		return poolRef.current.pool;
	};

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
			// A cancelled query must not create a pool nothing will destroy.
			throwIfAborted( signal );
			const frames = await extractFilmstripFrames(
				getPool( src ),
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
