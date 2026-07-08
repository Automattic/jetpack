import {
	createFrameExtractionPool,
	FAILURE_TTL_MS,
	SEEK_TIMEOUT_MS,
} from '../frame-extraction-pool';
import type { FrameSlot } from '../frame-extraction-pool';
import type { FrameGrabber } from '../video-frame-grabber';

// jsdom has no object-URL support; the pool only revokes (creation happens
// inside the DOM grabber, which these tests replace with manual fakes).
const revokeObjectURL = jest.fn();
beforeAll( () => {
	URL.revokeObjectURL = revokeObjectURL;
} );

beforeEach( () => {
	jest.useFakeTimers();
} );

afterEach( () => {
	jest.useRealTimers();
	revokeObjectURL.mockClear();
} );

/**
 * Drain chained promise continuations without advancing the fake clock (so
 * failure TTLs and seek timeouts stay exactly where the test put them).
 */
async function flushMicrotasks(): Promise< void > {
	for ( let i = 0; i < 20; i++ ) {
		await Promise.resolve();
	}
}

type PendingGrab = {
	timeMs: number;
	resolve: ( url?: string ) => void;
	reject: ( error?: Error ) => void;
};

type ManualGrabber = FrameGrabber & {
	log: string[];
	grabs: PendingGrab[];
};

/**
 * Build a FrameGrabber fake whose grabs stay pending until the test settles
 * them, recording every call. Resolved URLs default to `blob:{timeMs}`.
 *
 * @param options          - Failure switches.
 * @param options.failLoad - Reject load().
 * @return The manual grabber.
 */
function makeManualGrabber( options: { failLoad?: boolean } = {} ): ManualGrabber {
	const log: string[] = [];
	const grabs: PendingGrab[] = [];
	return {
		log,
		grabs,
		load: async () => {
			log.push( 'load' );
			if ( options.failLoad ) {
				throw new Error( 'load failed' );
			}
		},
		grabFrame: ( timeMs: number ) =>
			new Promise< string >( ( resolve, reject ) => {
				log.push( `grab:${ timeMs }` );
				grabs.push( {
					timeMs,
					resolve: ( url = `blob:${ timeMs }` ) => resolve( url ),
					reject: ( error = new Error( 'grab failed' ) ) => reject( error ),
				} );
			} ),
		destroy: () => {
			log.push( 'destroy' );
		},
	};
}

/**
 * Read one slot's status for terse assertions.
 *
 * @param slots - A slot map from the pool.
 * @param ms    - The frame time to read.
 * @return The slot's status.
 */
function statusOf( slots: Map< number, FrameSlot >, ms: number ): string | undefined {
	return slots.get( ms )?.status;
}

describe( 'createFrameExtractionPool', () => {
	it( 'grabs requested times strictly sequentially through one persistent grabber', async () => {
		const grabber = makeManualGrabber();
		const createGrabber = jest.fn( () => grabber );
		const pool = createFrameExtractionPool( { createGrabber } );

		const initial = pool.requestFrames( [ 1000, 2000 ] );
		expect( statusOf( initial, 1000 ) ).toBe( 'pending' );
		expect( statusOf( initial, 2000 ) ).toBe( 'pending' );

		await flushMicrotasks();
		// One seek at a time: the second grab waits for the first to settle.
		expect( grabber.log ).toEqual( [ 'load', 'grab:1000' ] );

		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		expect( grabber.log ).toEqual( [ 'load', 'grab:1000', 'grab:2000' ] );

		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();
		const slots = pool.peekFrames( [ 1000, 2000 ] );
		expect( slots.get( 1000 ) ).toEqual( { status: 'ready', url: 'blob:1000' } );
		expect( slots.get( 2000 ) ).toEqual( { status: 'ready', url: 'blob:2000' } );

		// The grabber outlives the batch — that's the whole point of the pool.
		expect( createGrabber ).toHaveBeenCalledTimes( 1 );
		expect( grabber.log ).not.toContain( 'destroy' );
	} );

	it( 'prioritizes newly requested times over stale queued ones', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );

		pool.requestFrames( [ 1000, 2000, 3000 ] );
		await flushMicrotasks();
		expect( grabber.log ).toEqual( [ 'load', 'grab:1000' ] );

		// A new (visible) window arrives while 1000 is still in flight.
		pool.requestFrames( [ 5000, 6000 ] );

		for ( let i = 0; i < 4; i++ ) {
			grabber.grabs[ grabber.grabs.length - 1 ].resolve();
			await flushMicrotasks();
		}
		grabber.grabs[ grabber.grabs.length - 1 ].resolve();
		await flushMicrotasks();

		expect( grabber.log ).toEqual( [
			'load',
			'grab:1000',
			// The fresh request jumps the queue …
			'grab:5000',
			'grab:6000',
			// … and the stale tail still completes afterwards.
			'grab:2000',
			'grab:3000',
		] );
	} );

	it( 'dedupes times that are cached, queued, or in flight', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );

		pool.requestFrames( [ 1000, 2000 ] );
		await flushMicrotasks();
		// Re-request while 1000 is in flight and 2000 is queued (plus an
		// internal duplicate): nothing is double-queued.
		pool.requestFrames( [ 1000, 2000, 2000 ] );

		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();

		expect( grabber.log.filter( entry => entry === 'grab:1000' ) ).toHaveLength( 1 );
		expect( grabber.log.filter( entry => entry === 'grab:2000' ) ).toHaveLength( 1 );

		// A ready frame is served from the cache, not re-grabbed.
		const again = pool.requestFrames( [ 1000 ] );
		expect( again.get( 1000 ) ).toEqual( { status: 'ready', url: 'blob:1000' } );
		await flushMicrotasks();
		expect( grabber.log.filter( entry => entry === 'grab:1000' ) ).toHaveLength( 1 );
	} );

	it( 'notifies subscribers as frames settle and stops after unsubscribe', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );
		const listener = jest.fn();
		const unsubscribe = pool.subscribe( listener );

		pool.requestFrames( [ 1000, 2000 ] );
		await flushMicrotasks();
		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		expect( listener ).toHaveBeenCalledTimes( 1 );

		unsubscribe();
		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();
		expect( listener ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'times out a hung seek, fails that frame only, and moves on', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );

		pool.requestFrames( [ 1000, 2000 ] );
		await flushMicrotasks();
		expect( grabber.log ).toEqual( [ 'load', 'grab:1000' ] );

		// The browser never answers the first seek.
		await jest.advanceTimersByTimeAsync( SEEK_TIMEOUT_MS );
		await flushMicrotasks();

		expect( statusOf( pool.peekFrames( [ 1000 ] ), 1000 ) ).toBe( 'failed' );
		// The queue is released — the next frame is already being sought —
		// and the grabber survives.
		expect( grabber.log ).toEqual( [ 'load', 'grab:1000', 'grab:2000' ] );
		expect( grabber.log ).not.toContain( 'destroy' );

		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();
		expect( statusOf( pool.peekFrames( [ 2000 ] ), 2000 ) ).toBe( 'ready' );

		// A URL produced after the timeout would otherwise leak: it is revoked.
		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:1000' );
	} );

	it( 'evicts the least recently used frame and revokes its URL', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber, cacheCap: 2 } );

		pool.requestFrames( [ 1000 ] );
		await flushMicrotasks();
		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		pool.requestFrames( [ 2000 ] );
		await flushMicrotasks();
		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();

		// Touch 1000 so 2000 becomes the least recently used.
		pool.requestFrames( [ 1000 ] );

		pool.requestFrames( [ 3000 ] );
		await flushMicrotasks();
		grabber.grabs[ 2 ].resolve();
		await flushMicrotasks();

		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ 'blob:2000' ] );
		const slots = pool.peekFrames( [ 1000, 2000, 3000 ] );
		expect( statusOf( slots, 1000 ) ).toBe( 'ready' );
		expect( statusOf( slots, 2000 ) ).toBe( 'pending' );
		expect( statusOf( slots, 3000 ) ).toBe( 'ready' );
	} );

	it( 'caches a failed grab briefly and retries after the TTL', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );

		pool.requestFrames( [ 1000 ] );
		await flushMicrotasks();
		grabber.grabs[ 0 ].reject();
		await flushMicrotasks();

		const failed = pool.requestFrames( [ 1000 ] );
		expect( statusOf( failed, 1000 ) ).toBe( 'failed' );
		await flushMicrotasks();
		// A fresh failure is not retried — no extraction hot loop.
		expect( grabber.log.filter( entry => entry === 'grab:1000' ) ).toHaveLength( 1 );

		await jest.advanceTimersByTimeAsync( FAILURE_TTL_MS );
		pool.requestFrames( [ 1000 ] );
		await flushMicrotasks();
		expect( grabber.log.filter( entry => entry === 'grab:1000' ) ).toHaveLength( 2 );

		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();
		expect( statusOf( pool.peekFrames( [ 1000 ] ), 1000 ) ).toBe( 'ready' );
	} );

	it( 'fails the whole queue when the media never loads, and retries with a new grabber', async () => {
		const grabbers: ManualGrabber[] = [];
		let failLoad = true;
		const createGrabber = jest.fn( () => {
			const grabber = makeManualGrabber( { failLoad } );
			failLoad = false;
			grabbers.push( grabber );
			return grabber;
		} );
		const pool = createFrameExtractionPool( { createGrabber } );

		pool.requestFrames( [ 1000, 2000 ] );
		await flushMicrotasks();

		const slots = pool.peekFrames( [ 1000, 2000 ] );
		expect( statusOf( slots, 1000 ) ).toBe( 'failed' );
		expect( statusOf( slots, 2000 ) ).toBe( 'failed' );
		// The dead grabber is torn down so a retry can start clean.
		expect( grabbers[ 0 ].log ).toEqual( [ 'load', 'destroy' ] );

		await jest.advanceTimersByTimeAsync( FAILURE_TTL_MS );
		pool.requestFrames( [ 1000 ] );
		await flushMicrotasks();
		expect( createGrabber ).toHaveBeenCalledTimes( 2 );
		expect( grabbers[ 1 ].log ).toEqual( [ 'load', 'grab:1000' ] );
	} );

	it( 'cancelFrames drops queued times but not the one in flight', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );

		pool.requestFrames( [ 1000, 2000, 3000 ] );
		await flushMicrotasks();
		pool.cancelFrames( [ 2000, 3000 ] );

		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		expect( grabber.log ).toEqual( [ 'load', 'grab:1000' ] );
		expect( statusOf( pool.peekFrames( [ 1000 ] ), 1000 ) ).toBe( 'ready' );
	} );

	it( 'takeFrames detaches URLs without revoking, or takes nothing when one is missing', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );

		pool.requestFrames( [ 1000, 2000 ] );
		await flushMicrotasks();
		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();

		// One requested time is not ready: nothing is taken.
		expect( pool.takeFrames( [ 1000, 2000, 3000 ] ) ).toBeNull();
		expect( statusOf( pool.peekFrames( [ 1000 ] ), 1000 ) ).toBe( 'ready' );

		expect( pool.takeFrames( [ 1000, 2000 ] ) ).toEqual( [ 'blob:1000', 'blob:2000' ] );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
		// Ownership moved to the caller: the pool no longer tracks them …
		expect( statusOf( pool.peekFrames( [ 1000 ] ), 1000 ) ).toBe( 'pending' );
		// … so destroying the pool does not revoke them either.
		pool.destroy();
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'destroy revokes cached URLs, destroys the grabber, fails all slots, and notifies', async () => {
		const grabber = makeManualGrabber();
		const pool = createFrameExtractionPool( { createGrabber: () => grabber } );
		const listener = jest.fn();
		pool.subscribe( listener );

		pool.requestFrames( [ 1000, 2000 ] );
		await flushMicrotasks();
		grabber.grabs[ 0 ].resolve();
		await flushMicrotasks();
		listener.mockClear();

		pool.destroy();

		expect( grabber.log ).toContain( 'destroy' );
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:1000' );
		expect( listener ).toHaveBeenCalledTimes( 1 );
		expect( statusOf( pool.peekFrames( [ 1000 ] ), 1000 ) ).toBe( 'failed' );
		expect( statusOf( pool.peekFrames( [ 2000 ] ), 2000 ) ).toBe( 'failed' );

		// The seek that was in flight when the pool died resolves later; its
		// URL is revoked instead of leaking, and nothing else is grabbed.
		grabber.grabs[ 1 ].resolve();
		await flushMicrotasks();
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:2000' );
		expect( grabber.log.filter( entry => entry.startsWith( 'grab:' ) ) ).toHaveLength( 2 );

		// Requests after destroy are inert and read as failed.
		const after = pool.requestFrames( [ 3000 ] );
		expect( statusOf( after, 3000 ) ).toBe( 'failed' );
		await flushMicrotasks();
		expect( grabber.log.filter( entry => entry.startsWith( 'grab:' ) ) ).toHaveLength( 2 );
	} );
} );
