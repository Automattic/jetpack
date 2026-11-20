import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import useFilmstrip, { FILMSTRIP_QUERY_KEY, isStoryboard } from '../use-filmstrip';
import type { Storyboard } from '../../types/edits';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const storyboard: Storyboard = {
	url: 'https://videopress.com/storyboard.jpg',
	tile_width: 160,
	tile_height: 90,
	tiles: 12,
	columns: 4,
	rows: 3,
	interval_ms: 1000,
};

beforeEach( () => jest.mocked( apiFetch ).mockReset() );

describe( 'useFilmstrip', () => {
	it( 'loads the source storyboard and reuses it across editor rerenders', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( storyboard );
		const { result, rerender } = renderHook( () => useFilmstrip( 'source12' ), {
			wrapper: createTestWrapper(),
		} );
		expect( result.current.status ).toBe( 'loading' );
		await waitFor( () => expect( result.current ).toEqual( { status: 'storyboard', storyboard } ) );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/source12/storyboard',
			signal: expect.any( AbortSignal ),
		} );
		rerender();
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'waits for processing and replaces a cached missing storyboard when ready', async () => {
		const client = createTestQueryClient();
		client.setQueryData( [ FILMSTRIP_QUERY_KEY, 'source12' ], null );
		jest.mocked( apiFetch ).mockResolvedValue( storyboard );
		const { result, rerender } = renderHook( ( { ready } ) => useFilmstrip( 'source12', ready ), {
			initialProps: { ready: false },
			wrapper: createTestWrapper( client ),
		} );
		expect( apiFetch ).not.toHaveBeenCalled();
		rerender( { ready: true } );
		await waitFor( () => expect( result.current.status ).toBe( 'storyboard' ) );
	} );

	it( 'recovers thumbnails generated after playback becomes ready, then stops polling', async () => {
		jest.useFakeTimers();
		try {
			jest
				.mocked( apiFetch )
				.mockRejectedValueOnce( { code: 'storyboard_unavailable' } )
				.mockResolvedValue( storyboard );
			const { result } = renderHook( () => useFilmstrip( 'source12' ), {
				wrapper: createTestWrapper(),
			} );
			await act( async () => jest.advanceTimersByTimeAsync( 1 ) );
			expect( apiFetch ).toHaveBeenCalledTimes( 1 );
			await act( async () => jest.advanceTimersByTimeAsync( 15000 ) );
			expect( result.current.status ).toBe( 'storyboard' );
			await act( async () => jest.advanceTimersByTimeAsync( 60000 ) );
			expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'bounds retries for a video with no storyboard', async () => {
		jest.useFakeTimers();
		try {
			jest.mocked( apiFetch ).mockRejectedValue( { code: 'storyboard_unavailable' } );
			renderHook( () => useFilmstrip( 'source12' ), { wrapper: createTestWrapper() } );
			await act( async () => jest.advanceTimersByTimeAsync( 120001 ) );
			const calls = jest.mocked( apiFetch ).mock.calls.length;
			await act( async () => jest.advanceTimersByTimeAsync( 60000 ) );
			expect( apiFetch ).toHaveBeenCalledTimes( calls );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'falls back to a neutral timeline when the storyboard service fails', async () => {
		jest.mocked( apiFetch ).mockRejectedValue( new Error( 'Unavailable' ) );
		const { result } = renderHook( () => useFilmstrip( 'source12' ), {
			wrapper: createTestWrapper(),
		} );
		await waitFor( () => expect( result.current.status ).toBe( 'unavailable' ) );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not expose malformed storyboard geometry to the timeline', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( { ...storyboard, columns: 0 } );
		const { result } = renderHook( () => useFilmstrip( 'source12' ), {
			wrapper: createTestWrapper(),
		} );
		await waitFor( () => expect( result.current.status ).toBe( 'unavailable' ) );
	} );

	it( 'does not request a storyboard without a source GUID', () => {
		renderHook( () => useFilmstrip( '' ), { wrapper: createTestWrapper() } );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );
} );

describe( 'isStoryboard', () => {
	it.each( [ undefined, 3, 4 ] )( 'accepts a descriptor with %s rows', rows => {
		expect( isStoryboard( { ...storyboard, rows } ) ).toBe( true );
	} );

	it.each( [
		null,
		'not a storyboard',
		{ ...storyboard, url: 'javascript:invalid' },
		{ ...storyboard, tile_width: 0 },
		{ ...storyboard, tile_height: -1 },
		{ ...storyboard, columns: 1.5 },
		{ ...storyboard, tiles: Number.MAX_SAFE_INTEGER + 1 },
		{ ...storyboard, interval_ms: Infinity },
		{ ...storyboard, rows: 2 },
	] )( 'rejects malformed geometry: %p', descriptor => {
		expect( isStoryboard( descriptor ) ).toBe( false );
	} );
} );
