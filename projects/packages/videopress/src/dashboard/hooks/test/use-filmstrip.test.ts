import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import useFilmstrip, { isStoryboard } from '../use-filmstrip';
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
