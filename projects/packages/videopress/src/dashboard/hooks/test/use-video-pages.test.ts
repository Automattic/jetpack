import { renderHook, waitFor } from '@testing-library/react';
import { getApiFetchMock, mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../test-utils/query-client-wrapper';
import { sanitizeVideoPages, useVideoPages, videoPagesQueryOptions } from '../use-video-pages';

describe( 'sanitizeVideoPages', () => {
	it( 'extracts the pages list and ignores the daily-plays tuples', () => {
		const result = sanitizeVideoPages( {
			data: [
				[ '2026-05-15', 3 ],
				[ '2026-05-16', 0 ],
			],
			pages: [ 'https://example.com/a', 'https://example.com/b' ],
		} );
		expect( result ).toEqual( {
			pages: [ 'https://example.com/a', 'https://example.com/b' ],
		} );
	} );

	it( 'survives missing keys and non-object payloads', () => {
		const empty = { pages: [] };
		expect( sanitizeVideoPages( {} ) ).toEqual( empty );
		expect( sanitizeVideoPages( { data: 'nope', pages: 42 } ) ).toEqual( empty );
		expect( sanitizeVideoPages( undefined ) ).toEqual( empty );
		expect( sanitizeVideoPages( null ) ).toEqual( empty );
		expect( sanitizeVideoPages( 'error' ) ).toEqual( empty );
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
		mockApiFetch( async () => ( {
			data: [ [ '2026-05-15', 3 ] ],
			pages: [ 'https://example.com/a' ],
		} ) );
		const options = videoPagesQueryOptions( 123 );
		const result = await options.queryFn!( {} as never );

		const [ [ args ] ] = getApiFetchMock().mock.calls;
		const path = ( args as { path: string } ).path;
		expect( path ).toContain( '/jetpack/v4/videopress/stats/video/123' );
		expect( path ).toContain( 'period=day' );
		expect( path ).toContain( 'num=30' );
		expect( result ).toEqual( { pages: [ 'https://example.com/a' ] } );
	} );
} );

describe( 'useVideoPages', () => {
	it( 'returns sanitized pages once loaded', async () => {
		mockApiFetch( async () => ( {
			data: [ [ '2026-05-15', 3 ] ],
			pages: [ 'https://example.com/a' ],
		} ) );

		const { result } = renderHook( () => useVideoPages( 123, { num: 7 } ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.pages ).toEqual( [ 'https://example.com/a' ] );
		expect( result.current.isError ).toBe( false );

		const [ [ args ] ] = getApiFetchMock().mock.calls;
		expect( ( args as { path: string } ).path ).toContain( 'num=7' );
	} );

	it( 'does not fetch when the post ID is falsy', () => {
		mockApiFetch( async () => ( {} ) );
		const { result } = renderHook( () => useVideoPages( '' ), {
			wrapper: createTestWrapper(),
		} );

		expect( getApiFetchMock() ).not.toHaveBeenCalled();
		expect( result.current.pages ).toEqual( [] );
	} );

	it( 'reports isError when the fetch fails', async () => {
		mockApiFetch( async () => {
			throw new Error( 'boom' );
		} );

		const { result } = renderHook( () => useVideoPages( 123 ), {
			wrapper: createTestWrapper(),
		} );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.pages ).toEqual( [] );
	} );
} );
