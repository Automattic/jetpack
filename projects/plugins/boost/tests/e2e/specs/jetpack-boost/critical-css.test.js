/* eslint-disable no-console,jest/no-commented-out-tests */
/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';
import { prerequisitesBuilder } from '../../lib/env/prerequisites';

describe( 'Critical CSS module', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).build();
	} );

	beforeEach( async function () {
		await JetpackBoostPage.visit( page );
	} );

	afterEach( async function () {
		await JetpackBoostPage.close( page );
	} );

	// it( 'should show Jetpack Boost admin UI', async () => {
	// 	await expect( page ).toHaveText( '.jb-signature--jetpack', 'Jetpack Boost' );
	// } );

	// @todo: Re-enable tests once Settings UI is ready
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
