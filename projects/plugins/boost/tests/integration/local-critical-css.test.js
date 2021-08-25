/* eslint-disable no-console,jest/no-commented-out-tests */
/**
 * External dependencies
 */
import 'expect-puppeteer';
import { loginUser, createURL } from '@wordpress/e2e-test-utils';

describe( 'Activate Local Critical CSS (aka Optimize CSS Loading)', () => {
	beforeAll( async () => {
		try {
			// log in
			await page.goto( createURL( '/wp-admin/admin.php' ) + '?page=jetpack-boost' );

			await page.on( 'pageerror', err => {
				console.warn( 'Page error', err );
			} );

			await page.on( 'error', err => {
				console.warn( 'Error', err );
			} );

			// wait 1 second so that in-page JS can focus username
			await new Promise( ( resolve, reject ) => setTimeout( resolve, 1000 ) );

			await loginUser();
			await page.waitForSelector( '#jb-settings' ); // this indicates the react app has loaded
		} catch ( err ) {
			console.error( err );
		}
	} );

	afterAll( async () => {
		// make sure to toggle Local Critical CSS off after the tests
		await page.goto( createURL( '/wp-admin/admin.php' ) + '?page=jetpack-boost' );
		const toggle = await page.$( '#jb-feature-toggle-critical-css' );
		await toggle.click();
	} );

	it( 'should show Jetpack Boost admin UI', async () => {
		await expect( page ).toMatch( 'Jetpack Boost' );
	} );

	// @todo: Re-enable tests once Settings UI is ready
	// it('should allow enabling critical css', async () => {
	// 	const toggle = await page.$( '.critical-css-toggle' );
	// 	await toggle.click();
	// 	await page.waitFor( '.critical-css-toggle input:checked' ); // notice that toggle worked
	// 	await page.waitFor( '.critical-css-progress' ); // wait for the progress bar, since we generate automatically on enable
	// })
} );
