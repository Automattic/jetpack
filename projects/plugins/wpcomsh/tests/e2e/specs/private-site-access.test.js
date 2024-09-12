/**
 * External dependencies
 */
const { get, head, isArray, isEmpty } = require( 'lodash' );

/**
 * Internal dependencies
 */
const {
	fetchPath,
	fetchPathLoggedIn,
	fetchPathLoggedInWithRestApiNonce,
	fetchPathLoggedOutWithRestApiNonce,
} = require( './access-test-utils' );

describe( 'Private Site -- Logged out Access', () => {
	it( 'Should show access denied on home page for logged out user', async () => {
		const res = await fetchPath();
		const homePage = await res.text();

		expect( homePage ).toMatch( /<div id=\"login\">/ );
		expect( homePage ).toMatch( /<title>Private Site<\/title>/ );

		expect( homePage ).not.toMatch( /wpcomsh test/ );
		expect( homePage ).not.toMatch( /this is a test post/ );
	} );

	it( 'Should show login page on /wp-admin for logged out user', async () => {
		const res = await fetchPath( '/wp-admin' );
		const wpAdmin = await res.text();

		expect( wpAdmin ).not.toMatch( /<body\s+.*\bclass="[^\"]*wp-admin[\s\"].*>/ );
		expect( wpAdmin ).not.toMatch( /wpcomsh test/ );
		expect( wpAdmin ).toMatch( '<title>Log In &lsaquo; Private Site &#8212; WordPress</title>' );
	} );

	it( 'Should show login page when browsed directly for logged out user', async () => {
		const res = await fetchPath( '/wp-login.php' );
		const wpLogin = await res.text();

		expect( wpLogin ).not.toMatch( /<body\s+.*\bclass="[^\"]*wp-admin[\s\"].*>/ );
		expect( wpLogin ).not.toMatch( /wpcomsh test/ );
		expect( wpLogin ).toMatch( 'Private Site' );
		expect( wpLogin ).toMatch( '<form name="loginform" id="loginform"' );
	} );

	it( 'Should show access denied for nopriv AJAX endpoints for logged out user', async () => {
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

	it( 'Should not show REST API posts for logged out user with nonce', async () => {
		const res = await fetchPathLoggedOutWithRestApiNonce( '/wp-json/wp/v2/posts' );
		const posts = await res.json();

		expect( posts ).toStrictEqual( {
			code: 'rest_cookie_invalid_nonce',
			data: {
				status: 403,
			},
			message: 'Cookie check failed',
		} );
	} );

	it( 'Should not show feed for logged out user', async () => {
		const res = await fetchPath( '/feed' );
		const feed = await res.text();
		expect( feed ).toMatch(
			/You need to be logged in as a user who has permission to view this site./
		);
		expect( feed ).not.toMatch( /<title>wpcomsh test<\/title>/ );
		expect( feed ).not.toMatch( /<title>this is a test post<\/title>/ );
	} );

	it( 'Should show restrictive robots.txt for logged out user', async () => {
		const res = await fetchPath( '/robots.txt' );
		const robotsTxt = await res.text();
		expect( robotsTxt ).toBe( 'User-agent: *\nDisallow: /\n' );
	} );

	it( 'Should show access denied for OPML resource', async () => {
		const res = await fetchPath( '/wp-links-opml.php' );
		const opml = await res.text();

		expect( opml ).toMatch( /<title>\s*Links for Private Site\s*<\/title>/ );
		expect( opml ).toMatch( '<error>This site is private.</error>' );

		expect( opml ).not.toMatch( /wpcomsh test/ );
		expect( opml ).not.toMatch( /this is a test post/ );
	} );
} );

describe( 'Private Site -- Logged in Access', () => {
	it( 'Should show home page for logged in user', async () => {
		const res = await fetchPathLoggedIn();
		const homePage = await res.text();
		expect( homePage ).not.toMatch( /<div id=\"login\">/ );
		expect( homePage ).not.toMatch( /<title>Private Site<\/title>/ );

		expect( homePage ).toMatch( /wpcomsh test/ );
		expect( homePage ).toMatch( /this is a test post/ );
	} );

	it( 'Should show /wp-admin for logged in user', async () => {
		const res = await fetchPathLoggedIn( '/wp-admin' );
		const wpAdmin = await res.text();

		expect( wpAdmin ).toMatch( /<body\s+.*\bclass="[^\"]*wp-admin[\s\"].*>/ );
		expect( wpAdmin ).toMatch( /wpcomsh test/ );
		expect( wpAdmin ).not.toMatch( 'Private Site' );
	}, 15000 );

	it( 'Should redirect when login page browsed directly for logged in user', async () => {
		const res = await fetchPathLoggedIn( '/wp-login.php?redirect_to=/' );
		expect( res.redirected ).toBe( true );

		const wpLogin = await res.text();

		expect( wpLogin ).toMatch( 'wpcomsh test' );
		expect( wpLogin ).not.toMatch( 'Log in' );
		expect( wpLogin ).not.toMatch( 'loginform' );
		expect( wpLogin ).not.toMatch( 'Private Site' );
	} );

	it( 'Should permit AJAX endpoints for logged in user', async () => {
		const res = await fetchPathLoggedIn( '/wp-admin/admin-ajax.php?action=logged-in' );
		const loggedIn = await res.json();

		expect( loggedIn ).toBe( 1 );
	} );

	it( 'Should not show REST API posts for logged in user without nonce', async () => {
		const res = await fetchPathLoggedIn( '/wp-json/wp/v2/posts' );
		const posts = await res.json();
		expect( posts ).toStrictEqual( {
			code: 'private_site',
			message: 'This site is private.',
			data: { status: 403 },
		} );
	} );

	it( 'Should not show REST API posts for logged in user with invalid nonce', async () => {
		const res = await fetchPathLoggedIn( '/wp-json/wp/v2/posts', {
			headers: {
				'X-WP-Nonce': 'bunchagibberish',
			},
		} );
		const posts = await res.json();
		expect( posts ).toStrictEqual( {
			code: 'rest_cookie_invalid_nonce',
			message: 'Cookie check failed',
			data: { status: 403 },
		} );
	} );

	it( 'Should show REST API posts for logged in user with nonce', async () => {
		const res = await fetchPathLoggedInWithRestApiNonce( '/wp-json/wp/v2/posts' );
		const posts = await res.json();

		expect( isArray( posts ) ).toBe( true );
		expect( isEmpty( posts ) ).toBe( false );
		const slug = get( head( posts ), 'slug' );
		expect( slug ).toBe( 'this-is-a-test-post' );
	} );

	it( 'Should show feed for logged in user', async () => {
		const res = await fetchPathLoggedIn( '/feed' );
		const bodyString = await res.text();
		expect( bodyString ).toMatch( /<title>wpcomsh test<\/title>/ );
		expect( bodyString ).toMatch( /<title>this is a test post<\/title>/ );
	} );

	it( 'Should show restrictive robots.txt for logged in user', async () => {
		const res = await fetchPathLoggedIn( '/robots.txt' );
		const robotsTxt = await res.text();
		expect( robotsTxt ).toBe( 'User-agent: *\nDisallow: /\n' );
	} );

	it( 'Should show OPML resource', async () => {
		const res = await fetchPathLoggedIn( '/wp-links-opml.php' );
		const opml = await res.text();

		expect( opml ).not.toMatch( /<title>\s*Links for Private Site\s*<\/title>/ );
		expect( opml ).not.toMatch( '<error>This site is private.</error>' );

		expect( opml ).toMatch( /wpcomsh test/ );
		// @TODO Add a "link" and make sure it shows up here and not in the logged-out tests
	} );
} );
