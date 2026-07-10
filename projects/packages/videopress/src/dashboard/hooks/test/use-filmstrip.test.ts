import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { makeLibraryItem } from '../../test-utils/library-item';
import {
	createFrameExtractionPool,
	extractFilmstripFrames,
	FILMSTRIP_QUERY_KEY,
	invalidateFilmstrip,
	MAX_FILMSTRIP_FRAMES,
	pickFrameTimes,
	useFilmstrip,
	useFrameExtractionPool,
} from '../use-filmstrip';
import type { Storyboard } from '../../types/edits';
import type { FrameExtractionPool } from '../use-filmstrip';
import type { FrameGrabber } from '../video-frame-grabber';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

// jsdom has no object-URL support; the code under test only revokes (creation
// happens inside the DOM grabber, which these tests replace with fakes).
const revokeObjectURL = jest.fn();
beforeAll( () => {
	URL.revokeObjectURL = revokeObjectURL;
} );

afterEach( () => {
	mockedApiFetch.mockReset();
	revokeObjectURL.mockClear();
} );

type FakeGrabberOptions = {
	/** Reject load(). */
	failLoad?: boolean;
	/** Reject the grab with this zero-based index. */
	failAtIndex?: number;
	/** Awaited inside each grab, before it resolves (gating/abort hook). */
	onGrab?: ( timeMs: number, index: number ) => void | Promise< void >;
};

type FakeGrabber = FrameGrabber & { log: string[] };

/**
 * Build a scriptable FrameGrabber fake that records its call sequence and
 * returns 'blob:frame-N' URLs.
 *
 * @param options - Failure/gating hooks.
 * @return The fake grabber.
 */
function makeFakeGrabber( options: FakeGrabberOptions = {} ): FakeGrabber {
	const log: string[] = [];
	let index = 0;
	return {
		log,
		load: async () => {
			log.push( 'load' );
			if ( options.failLoad ) {
				throw new Error( 'load failed' );
			}
		},
		grabFrame: async ( timeMs: number ) => {
			const current = index++;
			log.push( `grab:${ timeMs }` );
			await options.onGrab?.( timeMs, current );
			if ( options.failAtIndex === current ) {
				throw new Error( 'grab failed' );
			}
			return `blob:frame-${ current }`;
		},
		destroy: () => {
			log.push( 'destroy' );
		},
	};
}

/**
 * Build a valid Storyboard response body.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A complete Storyboard.
 */
function makeStoryboard( overrides: Partial< Storyboard > = {} ): Storyboard {
	return {
		url: 'https://example.com/sprite.jpg',
		tile_width: 160,
		tile_height: 90,
		tiles: 60,
		columns: 10,
		interval_ms: 1000,
		...overrides,
	};
}

/**
 * Wrap a fake grabber in a single-use extraction pool, the shape
 * extractFilmstripFrames consumes.
 *
 * @param grabber - The fake grabber the pool should drive.
 * @return The pool.
 */
function makePool( grabber: FrameGrabber ): FrameExtractionPool {
	return createFrameExtractionPool( { createGrabber: () => grabber } );
}

/**
 * Drain chained promise continuations (the pool settles frames over several
 * microtask turns).
 */
async function flushMicrotasks(): Promise< void > {
	for ( let i = 0; i < 20; i++ ) {
		await Promise.resolve();
	}
}

/**
 * Create an isolated QueryClient and a React wrapper component for renderHook.
 *
 * @return An object containing the client and wrapper component.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

describe( 'pickFrameTimes', () => {
	it( 'picks one midpoint per second for short videos', () => {
		// 3.2s → 4 slices of 800ms, sampled at their midpoints.
		expect( pickFrameTimes( 3200 ) ).toEqual( [ 400, 1200, 2000, 2800 ] );
	} );

	it( 'caps the count at MAX_FILMSTRIP_FRAMES for long videos', () => {
		const times = pickFrameTimes( 600000 ); // 10 minutes
		expect( times ).toHaveLength( MAX_FILMSTRIP_FRAMES );
		expect( times[ 0 ] ).toBe( 5000 );
		expect( times[ times.length - 1 ] ).toBe( 595000 );
	} );

	it( 'produces a single midpoint for sub-second durations', () => {
		expect( pickFrameTimes( 500 ) ).toEqual( [ 250 ] );
	} );
} );

describe( 'extractFilmstripFrames', () => {
	it( 'loads, grabs every time sequentially, keeps the grabber, and returns ordered URLs', async () => {
		const grabber = makeFakeGrabber();
		const pool = makePool( grabber );

		const frames = await extractFilmstripFrames( pool, [ 500, 1500, 2500 ] );

		expect( frames ).toEqual( [ 'blob:frame-0', 'blob:frame-1', 'blob:frame-2' ] );
		// The grabber survives the batch — it is the pool's to destroy.
		expect( grabber.log ).toEqual( [ 'load', 'grab:500', 'grab:1500', 'grab:2500' ] );
		expect( revokeObjectURL ).not.toHaveBeenCalled();

		// A completed batch is detached from the pool (ownership moved to the
		// caller), so destroying the pool releases the grabber but revokes
		// none of the returned URLs.
		pool.destroy();
		expect( grabber.log ).toContain( 'destroy' );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'returns null and stops grabbing when a grab fails; partials die with the pool', async () => {
		const grabber = makeFakeGrabber( { failAtIndex: 2 } );
		const pool = makePool( grabber );

		const frames = await extractFilmstripFrames( pool, [ 100, 200, 300, 400 ] );

		expect( frames ).toBeNull();
		// The failure cancelled the still-queued time.
		expect( grabber.log ).not.toContain( 'grab:400' );
		// Partial frames stay pooled (reusable) until the pool is destroyed.
		expect( revokeObjectURL ).not.toHaveBeenCalled();
		pool.destroy();
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-0',
			'blob:frame-1',
		] );
		expect( grabber.log ).toContain( 'destroy' );
	} );

	it( 'returns null without grabbing when the media fails to load', async () => {
		const grabber = makeFakeGrabber( { failLoad: true } );
		const pool = makePool( grabber );

		const frames = await extractFilmstripFrames( pool, [ 100, 200 ] );

		expect( frames ).toBeNull();
		// A grabber whose media never loads is torn down so a later request
		// can retry with a fresh one.
		expect( grabber.log ).toEqual( [ 'load', 'destroy' ] );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'stops at the abort point and re-throws; grabbed frames die with the pool', async () => {
		const controller = new AbortController();
		const grabber = makeFakeGrabber( {
			onGrab: ( _timeMs, index ) => {
				if ( index === 0 ) {
					controller.abort();
				}
			},
		} );
		const pool = makePool( grabber );

		await expect(
			extractFilmstripFrames( pool, [ 100, 200, 300 ], controller.signal )
		).rejects.toThrow();

		// The abort cancelled the queued times; the in-flight grab settles
		// into the pool and is revoked when the pool is destroyed.
		await flushMicrotasks();
		expect( grabber.log ).not.toContain( 'grab:200' );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
		pool.destroy();
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:frame-0' );
		expect( grabber.log ).toContain( 'destroy' );
	} );
} );

describe( 'useFilmstrip', () => {
	const STORYBOARD_PATH = '/wpcom/v2/videopress/abc123/storyboard';

	it( 'returns the storyboard when the endpoint serves one', async () => {
		const storyboard = makeStoryboard();
		mockedApiFetch.mockResolvedValueOnce( storyboard );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 60,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video ), { wrapper } );

		expect( result.current.status ).toBe( 'loading' );
		await waitFor( () => expect( result.current.status ).toBe( 'storyboard' ) );
		expect( mockedApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: STORYBOARD_PATH } )
		);
		expect( client.getQueryData( [ FILMSTRIP_QUERY_KEY, 'abc123' ] ) ).toEqual( {
			status: 'storyboard',
			storyboard,
		} );
	} );

	it( 'falls through to extraction when the storyboard 404s', async () => {
		mockedApiFetch.mockRejectedValueOnce( {
			code: 'storyboard_unavailable',
			data: { status: 404 },
		} );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 3,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber } ), { wrapper } );

		await waitFor( () => expect( result.current.status ).toBe( 'frames' ) );
		expect( createGrabber ).toHaveBeenCalledWith( 'https://example.com/clip.mp4' );
		expect( result.current ).toEqual( {
			status: 'frames',
			frames: [ 'blob:frame-0', 'blob:frame-1', 'blob:frame-2' ],
		} );
	} );

	it( 'treats a malformed storyboard body like a 404', async () => {
		// Shipped-but-broken response: missing url, zero columns.
		mockedApiFetch.mockResolvedValueOnce( { tiles: 60, columns: 0 } );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 1,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber } ), { wrapper } );

		await waitFor( () => expect( result.current.status ).toBe( 'frames' ) );
		expect( createGrabber ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'resolves to unavailable when there is no playable source', async () => {
		mockedApiFetch.mockRejectedValueOnce( { code: 'storyboard_unavailable' } );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( { durationSeconds: 60, sourceUrl: undefined } );

		const { result } = renderHook( () => useFilmstrip( video ), { wrapper } );

		await waitFor( () => expect( result.current.status ).toBe( 'unavailable' ) );
		expect( client.getQueryData( [ FILMSTRIP_QUERY_KEY, 'abc123' ] ) ).toEqual( {
			status: 'unavailable',
		} );
	} );

	it( 'resolves to unavailable instead of erroring when extraction fails', async () => {
		mockedApiFetch.mockRejectedValueOnce( { code: 'storyboard_unavailable' } );
		const createGrabber = jest.fn( () => makeFakeGrabber( { failLoad: true } ) );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 5,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber } ), { wrapper } );

		await waitFor( () => expect( result.current.status ).toBe( 'unavailable' ) );
	} );

	it( 'signs the extraction source with the playback token for private videos', async () => {
		mockedApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) => {
			if ( path.startsWith( '/wpcom/v2/videopress/playback-jwt/' ) ) {
				return Promise.resolve( { playback_token: 'JWT' } );
			}
			return Promise.reject( { code: 'storyboard_unavailable' } );
		} );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			isPrivate: true,
			durationSeconds: 1,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber } ), { wrapper } );

		await waitFor( () => expect( result.current.status ).toBe( 'frames' ) );
		expect( createGrabber ).toHaveBeenCalledWith(
			'https://example.com/clip.mp4?metadata_token=JWT'
		);
	} );

	it( 'revokes extraction frames when the cache entry is dropped', async () => {
		mockedApiFetch.mockRejectedValueOnce( { code: 'storyboard_unavailable' } );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 2,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result, unmount } = renderHook( () => useFilmstrip( video, { createGrabber } ), {
			wrapper,
		} );
		await waitFor( () => expect( result.current.status ).toBe( 'frames' ) );

		unmount();
		expect( revokeObjectURL ).not.toHaveBeenCalled();

		client.removeQueries( { queryKey: [ FILMSTRIP_QUERY_KEY, 'abc123' ] } );
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-0',
			'blob:frame-1',
		] );
	} );

	it( 'cancels an in-flight extraction on unmount and revokes partial frames', async () => {
		mockedApiFetch.mockRejectedValueOnce( { code: 'storyboard_unavailable' } );
		let release: ( () => void ) | undefined;
		const grabber = makeFakeGrabber( {
			onGrab: ( _timeMs, index ) => {
				if ( index === 1 ) {
					// Hold the second grab until the test releases it.
					return new Promise< void >( resolve => {
						release = resolve;
					} );
				}
			},
		} );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 3,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { unmount } = renderHook( () => useFilmstrip( video, { createGrabber: () => grabber } ), {
			wrapper,
		} );
		await waitFor( () => expect( release ).toBeDefined() );

		// Unmount destroys the pool (revoking the frame it holds and releasing
		// the grabber) and aborts the consumed query signal; the gated grab
		// settles afterwards and its URL is revoked instead of leaking.
		unmount();
		expect( grabber.log ).toContain( 'destroy' );
		release?.();

		await waitFor( () =>
			expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
				'blob:frame-0',
				'blob:frame-1',
			] )
		);
		// The third frame was never attempted.
		expect( grabber.log.filter( entry => entry.startsWith( 'grab:' ) ) ).toHaveLength( 2 );
	} );

	it( 'revokes replaced frames when a refetch swaps in a storyboard', async () => {
		const storyboard = makeStoryboard( { url: 'https://example.com/sprite-late.jpg' } );
		mockedApiFetch
			.mockRejectedValueOnce( { code: 'storyboard_unavailable' } )
			.mockResolvedValueOnce( storyboard );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const probeSprite = jest.fn( () => Promise.resolve() );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 2,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber, probeSprite } ), {
			wrapper,
		} );
		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'frames',
				frames: [ 'blob:frame-0', 'blob:frame-1' ],
			} )
		);

		// A later refetch finds a storyboard (e.g. the server generated one in
		// the meantime): nothing references the extracted URLs anymore.
		await act( async () => {
			await client.invalidateQueries( { queryKey: [ FILMSTRIP_QUERY_KEY, 'abc123' ] } );
		} );

		await waitFor( () => expect( result.current.status ).toBe( 'storyboard' ) );
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-0',
			'blob:frame-1',
		] );

		// Dropping the (now storyboard) entry has nothing left to revoke.
		revokeObjectURL.mockClear();
		client.removeQueries( { queryKey: [ FILMSTRIP_QUERY_KEY, 'abc123' ] } );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'revokes replaced frames when a refetch re-extracts', async () => {
		// Both fetches 404: the refetch runs a second extraction against the
		// SAME pool (takeFrames detached the first batch's times, so the
		// re-extraction seeks cleanly and returns a NEW array).
		mockedApiFetch.mockRejectedValue( { code: 'storyboard_unavailable' } );
		const grabber = makeFakeGrabber();
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 2,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber: () => grabber } ), {
			wrapper,
		} );
		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'frames',
				frames: [ 'blob:frame-0', 'blob:frame-1' ],
			} )
		);

		await act( async () => {
			await client.invalidateQueries( { queryKey: [ FILMSTRIP_QUERY_KEY, 'abc123' ] } );
		} );

		// The replaced batch was revoked on the swap; the new one is intact.
		await waitFor( () =>
			expect( result.current ).toEqual( {
				status: 'frames',
				frames: [ 'blob:frame-2', 'blob:frame-3' ],
			} )
		);
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-0',
			'blob:frame-1',
		] );

		// Dropping the entry revokes the CURRENT batch exactly once each — the
		// replacement branch must not double-revoke on the 'removed' event.
		revokeObjectURL.mockClear();
		client.removeQueries( { queryKey: [ FILMSTRIP_QUERY_KEY, 'abc123' ] } );
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-2',
			'blob:frame-3',
		] );
	} );

	it( 'keeps the cached storyboard when a refetch descriptor fetch fails', async () => {
		const storyboard = makeStoryboard();
		mockedApiFetch.mockResolvedValueOnce( storyboard );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const probeSprite = jest.fn( () => Promise.resolve() );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 60,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber, probeSprite } ), {
			wrapper,
		} );
		await waitFor( () => expect( result.current ).toEqual( { status: 'storyboard', storyboard } ) );

		// The save-landed invalidation races the pipeline's grid regen — the
		// likeliest moment for the descriptor GET to blip. The strip must NOT
		// downgrade to client extraction: a cached 'frames' entry would turn
		// every later invalidation into a permanent no-op (invalidateFilmstrip
		// skips frames mode) on top of burning a full re-extraction.
		mockedApiFetch.mockRejectedValueOnce( new Error( 'descriptor blip during regen' ) );
		act( () => {
			invalidateFilmstrip( client, 'abc123' );
		} );
		await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 ) );
		await act( async () => {
			await flushMicrotasks();
		} );
		expect( createGrabber ).not.toHaveBeenCalled();
		expect( result.current ).toEqual( { status: 'storyboard', storyboard } );

		// Still storyboard mode, so the NEXT invalidation retries the endpoint
		// and picks up the regenerated descriptor.
		const regenerated = makeStoryboard( { url: 'https://example.com/sprite-regen.jpg' } );
		mockedApiFetch.mockResolvedValueOnce( regenerated );
		act( () => {
			invalidateFilmstrip( client, 'abc123' );
		} );
		await waitFor( () =>
			expect( result.current ).toEqual( { status: 'storyboard', storyboard: regenerated } )
		);
		expect( createGrabber ).not.toHaveBeenCalled();
	} );

	describe( 'sprite watchdog', () => {
		it( 'probes the sprite and refetches once when it is dead', async () => {
			const dead = makeStoryboard( { url: 'https://example.com/sprite-dead.jpg' } );
			const fresh = makeStoryboard( { url: 'https://example.com/sprite-fresh.jpg' } );
			mockedApiFetch.mockResolvedValueOnce( dead ).mockResolvedValueOnce( fresh );
			const probeSprite = jest.fn( ( url: string ) =>
				url === dead.url ? Promise.reject( new Error( 'dead sprite' ) ) : Promise.resolve()
			);
			const { wrapper } = makeWrapper();
			const video = makeLibraryItem( {
				durationSeconds: 60,
				sourceUrl: 'https://example.com/clip.mp4',
			} );

			const { result } = renderHook( () => useFilmstrip( video, { probeSprite } ), { wrapper } );

			// The failed probe buys exactly one descriptor refetch, which heals
			// the strip in place with the regenerated sprite.
			await waitFor( () =>
				expect( result.current ).toEqual( { status: 'storyboard', storyboard: fresh } )
			);
			expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 );
			expect( probeSprite.mock.calls.map( call => call[ 0 ] ) ).toEqual( [ dead.url, fresh.url ] );
		} );

		it( 'does not loop when the refetched descriptor carries the same dead URL', async () => {
			const storyboard = makeStoryboard( { url: 'https://example.com/sprite-gone.jpg' } );
			mockedApiFetch.mockResolvedValue( storyboard );
			const probeSprite = jest.fn( () => Promise.reject( new Error( 'still dead' ) ) );
			const { wrapper } = makeWrapper();
			const video = makeLibraryItem( {
				durationSeconds: 60,
				sourceUrl: 'https://example.com/clip.mp4',
			} );

			const { result } = renderHook( () => useFilmstrip( video, { probeSprite } ), { wrapper } );

			await waitFor( () => expect( result.current.status ).toBe( 'storyboard' ) );
			// The failed probe spends its one refetch…
			await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 ) );
			// …and the same dead URL coming back is terminal: structural sharing
			// keeps the data reference-stable so the effect never re-runs, and
			// the dead-URL guard caps the spend regardless. Blank tiles stay
			// blank ('storyboard', never an error), and nothing loops.
			await act( async () => {
				await flushMicrotasks();
			} );
			expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 );
			expect( probeSprite ).toHaveBeenCalledTimes( 1 );
			expect( result.current ).toEqual( { status: 'storyboard', storyboard } );
		} );

		it( 'does not loop when the server mints a distinct dead sprite URL per fetch', async () => {
			// Signed/tokenized sprite URLs (or cache busters) arrive DIFFERENT
			// on every descriptor fetch, so the per-URL dead set alone can
			// never terminate: each refetch would present a "new" URL and buy
			// another refetch, hammering both endpoints with zero delay while
			// the sprite is dead. The per-guid budget must cap the spend at
			// the initial fetch plus one watchdog refetch.
			let mint = 0;
			mockedApiFetch.mockImplementation( () =>
				Promise.resolve(
					makeStoryboard( { url: `https://example.com/sprite.jpg?sig=${ ++mint }` } )
				)
			);
			const probeSprite = jest.fn( () => Promise.reject( new Error( 'dead sprite' ) ) );
			const { wrapper } = makeWrapper();
			const video = makeLibraryItem( {
				durationSeconds: 60,
				sourceUrl: 'https://example.com/clip.mp4',
			} );

			const { result } = renderHook( () => useFilmstrip( video, { probeSprite } ), { wrapper } );

			await waitFor( () => expect( result.current.status ).toBe( 'storyboard' ) );
			// The first failed probe buys the guid's one refetch…
			await waitFor( () => expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 ) );
			// …and the refetched URL — distinct, still dead — is probed but
			// must not buy another: the budget is per video, not per URL.
			await act( async () => {
				await flushMicrotasks();
			} );
			expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 );
			expect( probeSprite ).toHaveBeenCalledTimes( 2 );
			expect( result.current.status ).toBe( 'storyboard' );
		} );

		it( 'refunds the per-guid budget when a sprite probes healthy', async () => {
			// A second edit's regeneration must heal even though the video
			// already spent its refetch on the first one: the fresh sprite's
			// healthy probe resets the budget.
			const deadA = makeStoryboard( { url: 'https://example.com/sprite-dead-a.jpg' } );
			const freshA = makeStoryboard( { url: 'https://example.com/sprite-fresh-a.jpg' } );
			const deadB = makeStoryboard( { url: 'https://example.com/sprite-dead-b.jpg' } );
			const freshB = makeStoryboard( { url: 'https://example.com/sprite-fresh-b.jpg' } );
			mockedApiFetch
				.mockResolvedValueOnce( deadA )
				.mockResolvedValueOnce( freshA )
				.mockResolvedValueOnce( deadB )
				.mockResolvedValueOnce( freshB );
			const probeSprite = jest.fn( ( url: string ) =>
				url.includes( 'dead' ) ? Promise.reject( new Error( 'dead sprite' ) ) : Promise.resolve()
			);
			const { client, wrapper } = makeWrapper();
			const video = makeLibraryItem( {
				durationSeconds: 60,
				sourceUrl: 'https://example.com/clip.mp4',
			} );

			const { result } = renderHook( () => useFilmstrip( video, { probeSprite } ), { wrapper } );
			await waitFor( () =>
				expect( result.current ).toEqual( { status: 'storyboard', storyboard: freshA } )
			);
			// Let the healthy probe settle so the refund lands.
			await act( async () => {
				await flushMicrotasks();
			} );

			// A later edit job regenerates again; its external invalidation
			// serves another dead-then-fresh pair the watchdog can heal.
			act( () => {
				invalidateFilmstrip( client, 'abc123' );
			} );
			await waitFor( () =>
				expect( result.current ).toEqual( { status: 'storyboard', storyboard: freshB } )
			);
			expect( mockedApiFetch ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'leaves a healthy sprite alone', async () => {
			const storyboard = makeStoryboard( { url: 'https://example.com/sprite-ok.jpg' } );
			mockedApiFetch.mockResolvedValueOnce( storyboard );
			const probeSprite = jest.fn( () => Promise.resolve() );
			const { wrapper } = makeWrapper();
			const video = makeLibraryItem( {
				durationSeconds: 60,
				sourceUrl: 'https://example.com/clip.mp4',
			} );

			const { result } = renderHook( () => useFilmstrip( video, { probeSprite } ), { wrapper } );

			await waitFor( () => expect( result.current.status ).toBe( 'storyboard' ) );
			await act( async () => {
				await flushMicrotasks();
			} );
			expect( probeSprite ).toHaveBeenCalledTimes( 1 );
			expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );

describe( 'invalidateFilmstrip', () => {
	it( 'skips frames-mode data instead of burning a re-extraction', async () => {
		mockedApiFetch.mockRejectedValueOnce( { code: 'storyboard_unavailable' } );
		const createGrabber = jest.fn( () => makeFakeGrabber() );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 2,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { createGrabber } ), { wrapper } );
		await waitFor( () => expect( result.current.status ).toBe( 'frames' ) );

		act( () => {
			invalidateFilmstrip( client, 'abc123' );
		} );

		// Not even marked stale: frames mode has no server sprite to go stale,
		// and a refetch would re-run the whole extraction for identical tiles.
		expect( client.getQueryState( [ FILMSTRIP_QUERY_KEY, 'abc123' ] )?.isInvalidated ).toBe(
			false
		);
		await act( async () => {
			await flushMicrotasks();
		} );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'refetches storyboard-mode data and tolerates an empty cache', async () => {
		const first = makeStoryboard( { url: 'https://example.com/sprite-a.jpg' } );
		const second = makeStoryboard( { url: 'https://example.com/sprite-b.jpg' } );
		mockedApiFetch.mockResolvedValueOnce( first ).mockResolvedValueOnce( second );
		const probeSprite = jest.fn( () => Promise.resolve() );
		const { client, wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 60,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFilmstrip( video, { probeSprite } ), { wrapper } );
		await waitFor( () =>
			expect( result.current ).toEqual( { status: 'storyboard', storyboard: first } )
		);

		// An empty cache is a no-op, not a throw (nothing needs skipping).
		expect( () => invalidateFilmstrip( client, 'some-other-guid' ) ).not.toThrow();

		// The active observer refetches immediately despite staleTime Infinity.
		act( () => {
			invalidateFilmstrip( client, 'abc123' );
		} );
		await waitFor( () =>
			expect( result.current ).toEqual( { status: 'storyboard', storyboard: second } )
		);
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 );
	} );
} );

describe( 'useFrameExtractionPool', () => {
	it( 'serves a standing pool whose grabber uses the raw source for public videos', async () => {
		const grabber = makeFakeGrabber();
		const createGrabber = jest.fn( () => grabber );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 60,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFrameExtractionPool( video, { createGrabber } ), {
			wrapper,
		} );

		await waitFor( () => expect( result.current ).not.toBeNull() );
		// The pool is inert until the first request — no hidden <video> yet.
		expect( createGrabber ).not.toHaveBeenCalled();

		result.current?.requestFrames( [ 1500 ] );
		await waitFor( () =>
			expect( result.current?.peekFrames( [ 1500 ] ).get( 1500 )?.status ).toBe( 'ready' )
		);
		expect( createGrabber ).toHaveBeenCalledWith( 'https://example.com/clip.mp4' );
	} );

	it( 'destroys the pool (and its grabber) on unmount', async () => {
		const grabber = makeFakeGrabber();
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			durationSeconds: 60,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result, unmount } = renderHook(
			() => useFrameExtractionPool( video, { createGrabber: () => grabber } ),
			{ wrapper }
		);
		await waitFor( () => expect( result.current ).not.toBeNull() );
		result.current?.requestFrames( [ 1500 ] );
		await waitFor( () =>
			expect( result.current?.peekFrames( [ 1500 ] ).get( 1500 )?.status ).toBe( 'ready' )
		);

		unmount();
		expect( grabber.log ).toContain( 'destroy' );
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:frame-0' );
	} );

	it( 'waits for the playback token and signs the source for private videos', async () => {
		mockedApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) => {
			if ( path.startsWith( '/wpcom/v2/videopress/playback-jwt/' ) ) {
				return Promise.resolve( { playback_token: 'JWT' } );
			}
			return Promise.reject( { code: 'storyboard_unavailable' } );
		} );
		const grabber = makeFakeGrabber();
		const createGrabber = jest.fn( () => grabber );
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( {
			isPrivate: true,
			durationSeconds: 60,
			sourceUrl: 'https://example.com/clip.mp4',
		} );

		const { result } = renderHook( () => useFrameExtractionPool( video, { createGrabber } ), {
			wrapper,
		} );

		// Null until the JWT lands — a request now would just 403.
		expect( result.current ).toBeNull();
		await waitFor( () => expect( result.current ).not.toBeNull() );

		result.current?.requestFrames( [ 1500 ] );
		await waitFor( () =>
			expect( result.current?.peekFrames( [ 1500 ] ).get( 1500 )?.status ).toBe( 'ready' )
		);
		expect( createGrabber ).toHaveBeenCalledWith(
			'https://example.com/clip.mp4?metadata_token=JWT'
		);
	} );

	it( 'returns null when the video has no usable source', () => {
		const { wrapper } = makeWrapper();
		const video = makeLibraryItem( { durationSeconds: 60, sourceUrl: undefined } );

		const { result } = renderHook( () => useFrameExtractionPool( video ), { wrapper } );

		expect( result.current ).toBeNull();
	} );
} );
