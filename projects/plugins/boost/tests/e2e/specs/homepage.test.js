/**
 * Internal dependencies
 */
import Homepage from '../lib/pages/Homepage';

describe( 'Load home page', () => {
	beforeEach( async function () {
		await Homepage.visit( page, false );
	} );

	afterEach( async function () {
		await Homepage.close( page );
	} );

	it( 'should display "Just another WordPress site" text on page', async () => {
		await expect( page ).toHaveText( 'h1', 'e2e' );
	} );

	it( 'should include the jetpack boost meta tag(s)', async () => {
		const metaTag = await page.$$( "//meta[@name='jetpack-boost-ready']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );

	// we need to properly wait for local css generation to be complete before we can re-enable this test
	it.skip( 'should be ready', async () => {
		const metaTag = await page.$$( "//meta[@name='jetpack-boost-ready' and @content='true']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );
} );
