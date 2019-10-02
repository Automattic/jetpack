/**
 * External dependencies
 */
const fetch = require( 'node-fetch' );

/**
 * Internal dependencies
 */
const siteBaseUrl = 'http://nginx:8989';
const fetchPath = ( path = '' ) => fetch( `${ siteBaseUrl }${ path }` );

describe( 'Private Site Access', () => {
	it( 'Should show access denied on home page for logged out user', async () => {
		const res = await fetchPath();
		const bodyString = await res.text();

		expect( bodyString ).toMatch( /<div id=\"login\">/ );
		expect( bodyString ).toMatch( /<title>Private Site<\/title>/ );

		expect( bodyString ).not.toMatch( /wpcomsh test/ );
		expect( bodyString ).not.toMatch( /this is a test post/ );
	} );

	it( 'Should not show REST API posts for logged out user', async () => {
		const res = await fetchPath( '/wp-json/wp/v2/posts' );
		const posts = await res.json();

		expect( posts ).toStrictEqual( {
			code: 'private_site',
			data: {
				status: 403,
			},
			message: 'This site is private.',
		} );
	} );

	it( 'Should not show feed for logged out user', async () => {
		const res = await fetchPath( '/feed' );
		const bodyString = await res.text();
		expect( bodyString ).toMatch(
			/You need to be logged in as a user who has permission to view this site./
		);
		expect( bodyString ).not.toMatch( /<title>wpcomsh test<\/title>/ );
		expect( bodyString ).not.toMatch( /<title>this is a test post<\/title>/ );
	} );

	// This is failing even though browsers are behaving correctly. Commenting out until I figure out why
	it( 'Should show restrictive robots.txt for logged out user', async () => {
		const res = await fetchPath( '/robots.txt' );
		const bodyString = await res.text();
		expect( bodyString ).toBe( 'User-agent: *\nDisallow: /\n' );
		expect( true ).toBe( false );
	} );
} );
