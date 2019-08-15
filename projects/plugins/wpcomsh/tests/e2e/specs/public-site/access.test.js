/**
 * External dependencies
 */
const fetch = require( 'node-fetch' );
const { get, head, isArray, isEmpty } = require( 'lodash' );

/**
 * Internal dependencies
 */
const siteBaseUrl = 'http://nginx:8989';
const fetchPath = ( path = '' ) => fetch( `${ siteBaseUrl }${ path }` );

describe( 'Public Site Access', () => {
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
} );
