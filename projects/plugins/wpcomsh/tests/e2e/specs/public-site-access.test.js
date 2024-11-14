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
} = require( './access-test-utils' );

describe( 'Public Site -- Logged out Access', () => {
	it( 'Should show home page for logged out user', async () => {
		const res = await fetchPath();
		const bodyString = await res.text();
		expect( bodyString ).toMatch( /wpcomsh test/ );
		expect( bodyString ).toMatch( /this is a test post/ );
	} );

	it( 'Should show REST API posts for logged out user', async () => {
		const res = await fetchPath( '/wp-json/wp/v2/posts' );
		const posts = await res.json();
		expect( isArray( posts ) ).toBe( true );
		expect( isEmpty( posts ) ).toBe( false );
		const slug = get( head( posts ), 'slug' );
		expect( slug ).toBe( 'this-is-a-test-post' );
	} );

	it( 'Should show permissive robots.txt for logged out user', async () => {
		const res = await fetchPath( '/robots.txt' );
		const bodyString = await res.text();
		expect( bodyString ).toMatch(
			'User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n'
		);
	} );

	it( 'Should show feed for logged out user', async () => {
		const res = await fetchPath( '/feed' );
		const bodyString = await res.text();
		expect( bodyString ).toMatch( /<title>wpcomsh test<\/title>/ );
		expect( bodyString ).toMatch( /<title>this is a test post<\/title>/ );
	} );

	it( 'Should show OPML resource', async () => {
		const res = await fetchPath( '/wp-links-opml.php' );
		const opml = await res.text();

		expect( opml ).not.toMatch( /<title>\s*Links for Private Site\s*<\/title>/ );
		expect( opml ).not.toMatch( '<error>This site is private.</error>' );

		expect( opml ).toMatch( /wpcomsh test/ );
		// @TODO Add a "link" and make sure it shows up here & in the logged-in tests
	} );
} );

describe( 'Public Site -- Logged in Access', () => {
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

	it( 'Should show REST API posts for logged in user without nonce', async () => {
		const res = await fetchPathLoggedIn( '/wp-json/wp/v2/posts' );
		const posts = await res.json();

		expect( isArray( posts ) ).toBe( true );
		expect( isEmpty( posts ) ).toBe( false );
		const slug = get( head( posts ), 'slug' );
		expect( slug ).toBe( 'this-is-a-test-post' );
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

	it( 'Should show permissive robots.txt for logged in user', async () => {
		const res = await fetchPath( '/robots.txt' );
		const bodyString = await res.text();
		expect( bodyString ).toMatch(
			'User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n'
		);
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
