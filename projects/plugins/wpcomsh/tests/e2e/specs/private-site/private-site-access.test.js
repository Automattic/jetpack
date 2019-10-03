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

	it( 'Should show login page on /wp-admin for logged out user', async () => {
		const res = await fetchPath( '/wp-admin' );
		const bodyString = await res.text();

		expect( bodyString ).not.toMatch( /<body\s+.*\bclass="[^\"]*wp-admin[\s\"].*>/ );
		expect( bodyString ).not.toMatch( /wpcomsh test/ );
		expect( bodyString ).toMatch( '<title>Log In &lsaquo; Private Site &#8212; WordPress</title>' );
	} );

	it( 'Should show login page when browsed directly for logged out user', async () => {
		const res = await fetchPath( '/wp-login.php' );
		const bodyString = await res.text();

		expect( bodyString ).not.toMatch( /<body\s+.*\bclass="[^\"]*wp-admin[\s\"].*>/ );
		expect( bodyString ).not.toMatch( /wpcomsh test/ );
		expect( bodyString ).toMatch( '<title>Log In &lsaquo; Private Site &#8212; WordPress</title>' );
	} );

	it( 'Should show access denied nopriv AJAX endpoints for logged out user', async () => {
		const res = await fetchPath( '/wp-admin/admin-ajax.php?action=heartbeat' );
		const heartbeat = await res.json();

		expect( heartbeat ).toStrictEqual( {
			success: false,
			data: { code: 'private_site', message: 'This site is private.' },
		} );
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

	it( 'Should show restrictive robots.txt for logged out user', async () => {
		const res = await fetchPath( '/robots.txt' );
		const bodyString = await res.text();
		expect( bodyString ).toBe( 'User-agent: *\nDisallow: /\n' );
	} );

	it( 'Should show access denied for OPML resource', async () => {
		const res = await fetchPath( '/wp-links-opml.php' );
		const bodyString = await res.text();

		expect( bodyString ).toMatch( /<title>\s*Links for Private Site\s*<\/title>/ );
		expect( bodyString ).toMatch( '<error>This site is private.</error>' );

		expect( bodyString ).not.toMatch( /wpcomsh test/ );
		expect( bodyString ).not.toMatch( /this is a test post/ );

		expect( true ).toBe( true );
	} );
} );
