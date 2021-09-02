/**
 * External dependencies
 */
import { prerequisitesBuilder } from 'jetpack-e2e-tests/lib/env/prerequisites';

/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';

// TODO: This is for illustrative purpose only. It will need refactoring and improving.
describe( 'Critical CSS module', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).withConnection( true ).build();
	} );

	beforeEach( async function () {
		await JetpackBoostPage.visit( page );
	} );

	it( 'should allow enabling critical css', async () => {
		const toggle = await page.$( '#jb-feature-toggle-critical-css' );
		await toggle.click();

		await page.waitForResponse(
			response =>
				response.url().match( /jetpack-boost\/v1\/module\/critical-css\/status/ ) &&
				response.status() === 200,
			{ timeout: 60 * 1000 }
		);

		let toggleParent = await toggle.$( 'xpath=..' );
		let classNames = await toggleParent.getAttribute( 'class' );
		expect( classNames.includes( 'is-checked' ) ).toBeTruthy();

		await toggle.click();

		await page.waitForResponse(
			response =>
				response.url().match( /jetpack-boost\/v1\/module\/critical-css\/status/ ) &&
				response.status() === 200,
			{ timeout: 60 * 1000 }
		);

		toggleParent = await toggle.$( 'xpath=..' );
		classNames = await toggleParent.getAttribute( 'class' );
		expect( classNames.includes( 'is-checked' ) ).toBeFalsy();
	} );
} );
