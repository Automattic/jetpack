/**
 * Internal dependencies
 */
import Homepage from '../lib/pages/Homepage';

// TODO: This is for illustrative purpose only. It will need refactoring and improving.
describe( 'Homepage', () => {
	beforeEach( async function () {
		await Homepage.visit( page, false );
	} );

	it( 'Should display "HelloWord" text on page', async () => {
		await expect( page ).toHaveText( 'h1', 'HelloWord' );
	} );

	it( 'Should include the jetpack boost meta tag(s)', async () => {
		const metaTag = await page.$$( "//meta[@name='jetpack-boost-ready']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );

	// We need to properly wait for local css generation to be complete before we can re-enable this test
	it.skip( 'Should be ready', async () => {
		const metaTag = await page.$$( "//meta[@name='jetpack-boost-ready' and @content='true']" );
		expect( metaTag.length ).toBeGreaterThan( 0 );
	} );
} );
