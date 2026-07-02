import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { sanitizeVideoPages, useVideoPages, videoPagesQueryOptions } from '../use-video-pages';

describe( 'sanitizeVideoPages', () => {
	it( 'reshapes the expected { data, pages } payload', () => {
		const result = sanitizeVideoPages( {
			data: [
				[ '2026-05-15', 3 ],
				[ '2026-05-16', 0 ],
			],
			pages: [ 'https://example.com/a', 'https://example.com/b' ],
		} );
		expect( result.dailyPlays ).toEqual( [
			{ date: '2026-05-15', plays: 3 },
			{ date: '2026-05-16', plays: 0 },
		] );
		expect( result.pages ).toEqual( [ 'https://example.com/a', 'https://example.com/b' ] );
	} );

	it( 'survives missing keys and non-object payloads', () => {
		const empty = { dailyPlays: [], pages: [] };
		expect( sanitizeVideoPages( {} ) ).toEqual( empty );
		expect( sanitizeVideoPages( { data: 'nope', pages: 42 } ) ).toEqual( empty );
		expect( sanitizeVideoPages( undefined ) ).toEqual( empty );
		expect( sanitizeVideoPages( null ) ).toEqual( empty );
		expect( sanitizeVideoPages( 'error' ) ).toEqual( empty );
	} );

	it( 'drops malformed rows and coerces plays defensively', () => {
		const result = sanitizeVideoPages( {
			data: [
				'not-a-row',
				[ 7, 3 ], // date is not a string → dropped
				[ '2026-05-15' ], // missing plays → 0 (Number(undefined) is NaN)
				[ '2026-05-16', '4' ], // numeric string → coerced
				[ '2026-05-17', 'lots' ], // non-numeric → 0
			],
		} );
		expect( result.dailyPlays ).toEqual( [
			{ date: '2026-05-15', plays: 0 },
			{ date: '2026-05-16', plays: 4 },
			{ date: '2026-05-17', plays: 0 },
		] );
	} );

	it( 'keeps only string page URLs', () => {
		const result = sanitizeVideoPages( {
			pages: [ 'https://example.com/a', 7, null, { url: 'x' } ],
		} );
		expect( result.pages ).toEqual( [ 'https://example.com/a' ] );
	} );
} );

describe( 'videoPagesQueryOptions', () => {
	it( 'keys the query by post ID and window params', () => {
		const options = videoPagesQueryOptions( 123, { period: 'day', num: 7 } );
		expect( options.queryKey ).toEqual( [
			'jetpack-videopress-stats',
			'video-pages',
			'123',
			{ period: 'day', num: 7 },
		] );
	} );

	it( 'fetches the per-video stats proxy and sanitizes the body', async () => {
		mockApiFetch( async () => ( { data: [ [ '2026-05-15', 3 ] ], pages: [] } ) );
		const options = videoPagesQueryOptions( 123 );
		const result = await options.queryFn!( {} as never );

		const [ [ args ] ] = getApiFetchMock().mock.calls;
		const path = ( args as { path: string } ).path;
		expect( path ).toContain( '/jetpack/v4/videopress/stats/video/123' );
		expect( path ).toContain( 'period=day' );
		expect( path ).toContain( 'num=30' );
		expect( result.dailyPlays ).toEqual( [ { date: '2026-05-15', plays: 3 } ] );
	} );
} );

describe( 'useVideoPages', () => {
	it( 'returns sanitized plays and pages once loaded', async () => {
		mockApiFetch( async () => ( {
			data: [ [ '2026-05-15', 3 ] ],
			pages: [ 'https://example.com/a' ],
		} ) );

		const { result } = renderHook( () => useVideoPages( 123, { num: 7 } ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.dailyPlays ).toEqual( [ { date: '2026-05-15', plays: 3 } ] );
		expect( result.current.pages ).toEqual( [ 'https://example.com/a' ] );

		const [ [ args ] ] = getApiFetchMock().mock.calls;
		expect( ( args as { path: string } ).path ).toContain( 'num=7' );
	} );

	it( 'does not fetch when the post ID is falsy', () => {
		mockApiFetch( async () => ( {} ) );
		const { result } = renderHook( () => useVideoPages( '' ), {
			wrapper: createTestWrapper(),
		} );

		expect( getApiFetchMock() ).not.toHaveBeenCalled();
		expect( result.current.dailyPlays ).toEqual( [] );
		expect( result.current.pages ).toEqual( [] );
	} );
} );
