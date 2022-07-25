import getRedirectUrl from '../';

describe( 'getRedirectUrl', () => {
	it( 'simple url', () => {
		const url = getRedirectUrl( 'simple' );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'source' ) ).toBe( 'simple' );
	} );

	it( 'Random param', () => {
		const url = getRedirectUrl( 'simple', { random: 'asd' } );
		expect( url ).toBe( 'https://jetpack.com/redirect/?source=simple&random=asd' );
	} );

	it( 'Test path', () => {
		const url = getRedirectUrl( 'simple', { path: '1234' } );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'source' ) ).toBe( 'simple' );
		expect( parsedUrl.searchParams.get( 'path' ) ).toBe( '1234' );
	} );

	it( 'Test path with special chars', () => {
		const url = getRedirectUrl( 'simple', { path: 'weird value!' } );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'source' ) ).toBe( 'simple' );
		expect( parsedUrl.searchParams.get( 'path' ) ).toBe( 'weird value!' );
	} );

	it( 'Test query', () => {
		const url = getRedirectUrl( 'simple', { query: 'key=1234&other=super' } );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'source' ) ).toBe( 'simple' );
		expect( parsedUrl.searchParams.get( 'query' ) ).toBe( 'key=1234&other=super' );
	} );

	it( 'Test anchor', () => {
		const url = getRedirectUrl( 'simple', { anchor: 'section' } );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'source' ) ).toBe( 'simple' );
		expect( parsedUrl.searchParams.get( 'anchor' ) ).toBe( 'section' );
	} );

	it( 'Test all', () => {
		const url = getRedirectUrl( 'simple', {
			query: 'key=1234&other=super',
			anchor: 'section',
			site: 'example.org',
			path: 123,
		} );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'source' ) ).toBe( 'simple' );
		expect( parsedUrl.searchParams.get( 'anchor' ) ).toBe( 'section' );
		expect( parsedUrl.searchParams.get( 'query' ) ).toBe( 'key=1234&other=super' );
		expect( parsedUrl.searchParams.get( 'site' ) ).toBe( 'example.org' );
		expect( parsedUrl.searchParams.get( 'path' ) ).toBe( '123' );
	} );

	it( 'Test passing an URL as the first parameter', () => {
		const url = getRedirectUrl( 'https://wordpress.com/support' );
		const value = encodeURIComponent( 'https://wordpress.com/support' );
		expect( url ).toBe( `https://jetpack.com/redirect/?url=${ value }` );
	} );

	it( 'Test passing an URL as the first parameter and query', () => {
		const url = getRedirectUrl( 'https://wordpress.com/support', {
			query: 'key=1234&other=super',
		} );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'url' ) ).toBe( 'https://wordpress.com/support' );
		expect( parsedUrl.searchParams.get( 'query' ) ).toBe( 'key=1234&other=super' );
	} );

	it( 'Test passing an URL as the first parameter and query discarding info from url', () => {
		const url = getRedirectUrl( 'https://wordpress.com/support?super=mega&key=value#section1', {
			query: 'key=1234&other=super',
		} );
		const parsedUrl = new URL( url );

		expect( parsedUrl.searchParams.get( 'url' ) ).toBe( 'https://wordpress.com/support' );
		expect( parsedUrl.searchParams.get( 'query' ) ).toBe( 'key=1234&other=super' );
	} );
} );
