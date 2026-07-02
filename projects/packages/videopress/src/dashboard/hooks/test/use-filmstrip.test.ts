import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { makeLibraryItem } from '../../test-utils/library-item';
import {
	extractFilmstripFrames,
	FILMSTRIP_QUERY_KEY,
	MAX_FILMSTRIP_FRAMES,
	pickFrameTimes,
	useFilmstrip,
} from '../use-filmstrip';
import type { Storyboard } from '../../types/edits';
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
	it( 'loads, grabs every time sequentially, destroys, and returns ordered URLs', async () => {
		const grabber = makeFakeGrabber();

		const frames = await extractFilmstripFrames( grabber, [ 500, 1500, 2500 ] );

		expect( frames ).toEqual( [ 'blob:frame-0', 'blob:frame-1', 'blob:frame-2' ] );
		expect( grabber.log ).toEqual( [ 'load', 'grab:500', 'grab:1500', 'grab:2500', 'destroy' ] );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'returns null, revokes partial frames, and destroys when a grab fails', async () => {
		const grabber = makeFakeGrabber( { failAtIndex: 2 } );

		const frames = await extractFilmstripFrames( grabber, [ 100, 200, 300, 400 ] );

		expect( frames ).toBeNull();
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-0',
			'blob:frame-1',
		] );
		expect( grabber.log ).not.toContain( 'grab:400' );
		expect( grabber.log ).toContain( 'destroy' );
	} );

	it( 'returns null without grabbing when the media fails to load', async () => {
		const grabber = makeFakeGrabber( { failLoad: true } );

		const frames = await extractFilmstripFrames( grabber, [ 100, 200 ] );

		expect( frames ).toBeNull();
		expect( grabber.log ).toEqual( [ 'load', 'destroy' ] );
		expect( revokeObjectURL ).not.toHaveBeenCalled();
	} );

	it( 'stops at the abort point, revokes grabbed frames, and re-throws', async () => {
		const controller = new AbortController();
		const grabber = makeFakeGrabber( {
			onGrab: ( _timeMs, index ) => {
				if ( index === 0 ) {
					controller.abort();
				}
			},
		} );

		await expect(
			extractFilmstripFrames( grabber, [ 100, 200, 300 ], controller.signal )
		).rejects.toThrow();

		// The first grab completed before the abort was observed; it is revoked
		// and the remaining times are never attempted.
		expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:frame-0' );
		expect( grabber.log ).not.toContain( 'grab:200' );
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

		// Unmount aborts the consumed query signal; the orchestrator observes
		// it after the gated grab settles.
		unmount();
		release?.();

		await waitFor( () => expect( grabber.log ).toContain( 'destroy' ) );
		expect( revokeObjectURL.mock.calls.map( call => call[ 0 ] ) ).toEqual( [
			'blob:frame-0',
			'blob:frame-1',
		] );
		// The third frame was never attempted.
		expect( grabber.log.filter( entry => entry.startsWith( 'grab:' ) ) ).toHaveLength( 2 );
	} );
} );
