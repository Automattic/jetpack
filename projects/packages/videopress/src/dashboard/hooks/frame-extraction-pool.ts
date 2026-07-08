/**
 * The orchestration layer for client-side frame extraction: one persistent
 * FrameGrabber per pool (one pool per video), a strictly sequential seek
 * queue that prioritizes the newest requests, a per-seek timeout so a hung
 * seek fails one frame instead of wedging the queue, and an incremental
 * ms-keyed LRU cache of frame object URLs with its own revocation.
 *
 * The pool is deliberately grabber-agnostic — tests drive it with scripted
 * fakes; the DOM adapter lives in video-frame-grabber.ts. Consumers request
 * frame times and subscribe for settlement; useFilmstrip's batch frames-mode
 * and the timeline's future sub-interval densification both ride this one
 * path.
 */
import type { FrameGrabber } from './video-frame-grabber';

/** Upper bound on cached frame object URLs; the least recent are revoked first. */
export const FRAME_CACHE_CAP = 300;

/** A seek unanswered within this window fails that frame, not the pool. */
export const SEEK_TIMEOUT_MS = 4000;

/** Failed frames are remembered this long so retries can't hot-loop. */
export const FAILURE_TTL_MS = 15000;

/** The externally visible state of one requested frame time. */
export type FrameSlot =
	| { status: 'ready'; url: string }
	| { status: 'pending' }
	| { status: 'failed' };

/** What the LRU actually stores; failures expire, ready frames are evicted. */
type CacheEntry = { status: 'ready'; url: string } | { status: 'failed'; expiresAt: number };

export interface FrameExtractionPool {
	/**
	 * Ask for frames at the given times. Times already cached (or freshly
	 * failed) are not re-queued; the rest are enqueued AHEAD of anything
	 * already waiting — the newest request is presumed visible. Returns the
	 * current slot for every requested time.
	 */
	requestFrames: ( timesMs: number[] ) => Map< number, FrameSlot >;
	/** Read slots without enqueueing anything (unknown times read as pending). */
	peekFrames: ( timesMs: number[] ) => Map< number, FrameSlot >;
	/** Drop still-queued times (in-flight and settled ones are untouched). */
	cancelFrames: ( timesMs: number[] ) => void;
	/**
	 * Remove the given times from the cache and return their URLs WITHOUT
	 * revoking — ownership transfers to the caller (useFilmstrip hands the
	 * batch to the react-query cache, whose drop listener revokes them).
	 * Returns null, taking nothing, unless every time is ready.
	 */
	takeFrames: ( timesMs: number[] ) => string[] | null;
	/** Be notified after any frame settles (ready or failed) or on destroy. */
	subscribe: ( listener: () => void ) => () => void;
	/** Revoke every cached URL, destroy the grabber, and fail all slots. */
	destroy: () => void;
}

export type FrameExtractionPoolOptions = {
	/** Grabber factory, invoked lazily on the first frame request. */
	createGrabber: () => FrameGrabber;
	/** LRU capacity override (tests); defaults to FRAME_CACHE_CAP. */
	cacheCap?: number;
	/** Per-seek/load timeout override (tests); defaults to SEEK_TIMEOUT_MS. */
	seekTimeoutMs?: number;
	/** Failure memory override (tests); defaults to FAILURE_TTL_MS. */
	failureTtlMs?: number;
};

/**
 * Race a grabber promise against the seek timeout. When the timeout wins,
 * the underlying operation is NOT cancelled (one detached <video> answers
 * when it answers) — but a frame URL it produces after the fact is handed to
 * `onLate` so it can be revoked instead of leaking.
 *
 * @param promise   - The grabber operation.
 * @param timeoutMs - How long to wait before giving up on this frame.
 * @param onLate    - Receives a value the operation produces after timing out.
 * @return The operation's result, or a rejection on timeout/failure.
 */
function raceTimeout< T >(
	promise: Promise< T >,
	timeoutMs: number,
	onLate?: ( value: T ) => void
): Promise< T > {
	return new Promise< T >( ( resolve, reject ) => {
		let settled = false;
		const timer = setTimeout( () => {
			if ( settled ) {
				return;
			}
			settled = true;
			promise.then(
				value => onLate?.( value ),
				() => {}
			);
			reject( new Error( 'The frame extraction timed out.' ) );
		}, timeoutMs );
		promise.then(
			value => {
				if ( settled ) {
					return;
				}
				settled = true;
				clearTimeout( timer );
				resolve( value );
			},
			error => {
				if ( settled ) {
					return;
				}
				settled = true;
				clearTimeout( timer );
				reject( error );
			}
		);
	} );
}

/**
 * Create a frame-extraction pool over a (lazily created) FrameGrabber.
 *
 * @param options - The grabber factory plus test-seam overrides.
 * @return The pool.
 */
export function createFrameExtractionPool(
	options: FrameExtractionPoolOptions
): FrameExtractionPool {
	const {
		createGrabber,
		cacheCap = FRAME_CACHE_CAP,
		seekTimeoutMs = SEEK_TIMEOUT_MS,
		failureTtlMs = FAILURE_TTL_MS,
	} = options;

	// Map insertion order doubles as LRU order: touching an entry re-inserts
	// it at the tail, evictions pop from the head.
	const cache = new Map< number, CacheEntry >();
	const queue: number[] = [];
	const listeners = new Set< () => void >();
	let inFlightMs: number | null = null;
	let destroyed = false;
	let pumping = false;
	let grabber: FrameGrabber | null = null;
	let grabberReady: Promise< void > | null = null;

	const notify = () => {
		// Copy first: a listener may unsubscribe (or subscribe) mid-notify.
		[ ...listeners ].forEach( listener => listener() );
	};

	/**
	 * (Re-)insert a cache entry at the LRU tail.
	 *
	 * @param ms    - The frame time.
	 * @param entry - Its new entry.
	 */
	const touch = ( ms: number, entry: CacheEntry ) => {
		cache.delete( ms );
		cache.set( ms, entry );
	};

	const evictOverCap = () => {
		while ( cache.size > cacheCap ) {
			const oldest = cache.keys().next();
			if ( oldest.done ) {
				return;
			}
			const entry = cache.get( oldest.value );
			cache.delete( oldest.value );
			if ( entry?.status === 'ready' ) {
				URL.revokeObjectURL( entry.url );
			}
		}
	};

	/**
	 * The externally visible slot for a time: cache state first, otherwise
	 * pending (queued, in flight, or simply never requested).
	 *
	 * @param ms - The frame time.
	 * @return The slot.
	 */
	const slotOf = ( ms: number ): FrameSlot => {
		if ( destroyed ) {
			return { status: 'failed' };
		}
		const entry = cache.get( ms );
		if ( entry?.status === 'ready' ) {
			return { status: 'ready', url: entry.url };
		}
		if ( entry?.status === 'failed' && Date.now() < entry.expiresAt ) {
			return { status: 'failed' };
		}
		return { status: 'pending' };
	};

	/**
	 * Record a batch of failures and let subscribers know.
	 *
	 * @param timesMs - The frame times that failed.
	 */
	const failFrames = ( timesMs: number[] ) => {
		const expiresAt = Date.now() + failureTtlMs;
		timesMs.forEach( ms => touch( ms, { status: 'failed', expiresAt } ) );
		evictOverCap();
		notify();
	};

	/**
	 * Lazily create the grabber and wait for its metadata, under the timeout.
	 *
	 * @return The loaded grabber.
	 */
	const ensureGrabber = async (): Promise< FrameGrabber > => {
		if ( ! grabber ) {
			grabber = createGrabber();
			grabberReady = raceTimeout( grabber.load(), seekTimeoutMs );
		}
		await grabberReady;
		return grabber;
	};

	/**
	 * Drain the queue, one seek at a time. A single pump runs at once;
	 * requestFrames re-invokes it after every enqueue (no-op while running).
	 */
	const pump = async (): Promise< void > => {
		if ( pumping || destroyed ) {
			return;
		}
		pumping = true;
		try {
			while ( ! destroyed && queue.length > 0 ) {
				let loaded: FrameGrabber;
				try {
					loaded = await ensureGrabber();
				} catch {
					// The media never loaded: nothing queued can succeed. Fail
					// everything and tear the grabber down so a request after
					// the failure TTL can retry from scratch.
					if ( destroyed ) {
						return;
					}
					grabber?.destroy();
					grabber = null;
					grabberReady = null;
					failFrames( queue.splice( 0 ) );
					return;
				}
				if ( destroyed ) {
					return;
				}
				const ms = queue.shift() as number;
				inFlightMs = ms;
				try {
					const url = await raceTimeout( loaded.grabFrame( ms ), seekTimeoutMs, late =>
						URL.revokeObjectURL( late )
					);
					if ( destroyed ) {
						// Destroyed mid-seek: the pool no longer tracks this
						// URL, so revoke it here or leak it.
						URL.revokeObjectURL( url );
						return;
					}
					touch( ms, { status: 'ready', url } );
					evictOverCap();
					notify();
				} catch {
					if ( destroyed ) {
						return;
					}
					// One bad seek (timeout, decode hiccup) fails one frame;
					// the grabber and the rest of the queue live on.
					failFrames( [ ms ] );
				} finally {
					inFlightMs = null;
				}
			}
		} finally {
			pumping = false;
			inFlightMs = null;
		}
	};

	const peekFrames = ( timesMs: number[] ): Map< number, FrameSlot > => {
		return new Map( timesMs.map( ms => [ ms, slotOf( ms ) ] ) );
	};

	const requestFrames = ( timesMs: number[] ): Map< number, FrameSlot > => {
		if ( ! destroyed ) {
			const now = Date.now();
			const toQueue: number[] = [];
			const seen = new Set< number >();
			for ( const ms of timesMs ) {
				if ( seen.has( ms ) || ms === inFlightMs ) {
					continue;
				}
				seen.add( ms );
				const entry = cache.get( ms );
				if ( entry?.status === 'ready' ) {
					touch( ms, entry );
					continue;
				}
				if ( entry?.status === 'failed' ) {
					if ( now < entry.expiresAt ) {
						continue;
					}
					// The failure aged out; forget it and try again.
					cache.delete( ms );
				}
				toQueue.push( ms );
			}
			if ( toQueue.length > 0 ) {
				// Prioritize: the new batch jumps the line, and any stale
				// queued copies of the same times are dropped (dedupe).
				const batch = new Set( toQueue );
				const stale = queue.filter( ms => ! batch.has( ms ) );
				queue.length = 0;
				queue.push( ...toQueue, ...stale );
				void pump();
			}
		}
		return peekFrames( timesMs );
	};

	const cancelFrames = ( timesMs: number[] ): void => {
		if ( destroyed || queue.length === 0 ) {
			return;
		}
		const dropped = new Set( timesMs );
		let write = 0;
		for ( const ms of queue ) {
			if ( ! dropped.has( ms ) ) {
				queue[ write++ ] = ms;
			}
		}
		queue.length = write;
	};

	const takeFrames = ( timesMs: number[] ): string[] | null => {
		const urls: string[] = [];
		for ( const ms of timesMs ) {
			const entry = cache.get( ms );
			if ( entry?.status !== 'ready' ) {
				return null;
			}
			urls.push( entry.url );
		}
		timesMs.forEach( ms => cache.delete( ms ) );
		return urls;
	};

	const subscribe = ( listener: () => void ): ( () => void ) => {
		listeners.add( listener );
		return () => {
			listeners.delete( listener );
		};
	};

	const destroy = (): void => {
		if ( destroyed ) {
			return;
		}
		destroyed = true;
		queue.length = 0;
		grabber?.destroy();
		grabber = null;
		grabberReady = null;
		cache.forEach( entry => {
			if ( entry.status === 'ready' ) {
				URL.revokeObjectURL( entry.url );
			}
		} );
		cache.clear();
		// Waiters observe every slot as failed and settle; then drop them.
		notify();
		listeners.clear();
	};

	return { requestFrames, peekFrames, cancelFrames, takeFrames, subscribe, destroy };
}
