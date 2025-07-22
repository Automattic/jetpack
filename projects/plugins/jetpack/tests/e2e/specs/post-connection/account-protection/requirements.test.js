import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import ProfilePage from '_jetpack-e2e-commons/pages/wp-admin/profile.js';
import playwrightConfig from '../../../playwright.config.mjs';

test.beforeAll( async ( { browser } ) => {
	// Set up a clean environment with account protection enabled.
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withInactiveModules( [ 'protect', 'sso' ] )
		.withActiveModules( [ 'account-protection' ] )
		.build();

	await page.close();
} );

test.describe.parallel( 'Strong password requirements', () => {
	test( 'Enforces strong password requirements', async ( { page } ) => {
		const profilePage = await ProfilePage.visit( page );

		await profilePage.page.getByRole( 'button' ).filter( { hasText: 'set new password' } ).click();

		// Validate that the Jetpack password strength meter replaces the default one.
		await expect( profilePage.page.locator( '.strength-meter' ) ).toBeVisible();
		await expect( profilePage.page.locator( '#pass-strength-result' ) ).toBeHidden();
		await expect( profilePage.page.getByRole( 'checkbox', { name: 'pw_weak' } ) ).toBeHidden();

		// Wait for the default password to be validated.
		await expect( profilePage.page.locator( '#pass1' ) ).not.toBeEmpty();
		await expect(
			profilePage.page.locator( '.strength-meter' ).filter( { hasNotText: 'Validating' } )
		).toBeVisible();

		// Enter a weak password.
		const passwordInput = profilePage.page.locator( '#pass1' );
		await passwordInput.fill( 'password' );
		await passwordInput.evaluate( input => {
			input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		} );

		// Validate that the Jetpack password strength meter displays "Weak".
		await expect( profilePage.page.locator( '.strength-meter' ).getByText( 'Weak' ) ).toBeVisible();
		await expect( profilePage.page.getByText( 'Strong password' ) ).toHaveCSS(
			'color',
			'rgb(230, 80, 84)'
		);
		await expect( profilePage.page.getByText( 'Not a leaked password' ) ).toHaveCSS(
			'color',
			'rgb(230, 80, 84)'
		);
		await expect( profilePage.page.getByText( 'Between 6 and 150 characters' ) ).toHaveCSS(
			'color',
			'rgb(0, 135, 16)'
		);
		await expect( profilePage.page.getByText( "Doesn't match existing user data" ) ).toHaveCSS(
			'color',
			'rgb(0, 135, 16)'
		);
		await expect( profilePage.page.getByText( 'Not used recently' ) ).toHaveCSS(
			'color',
			'rgb(0, 135, 16)'
		);

		await expect( profilePage.page.getByText( 'Confirm use of weak password' ) ).toBeVisible();
		await expect( profilePage.page.getByText( 'Update Profile', { exact: true } ) ).toBeDisabled();

		// check the checkbox to disable the weak password.
		await profilePage.page.locator( '.pw-checkbox' ).check();

		await expect( profilePage.page.getByText( 'Update Profile', { exact: true } ) ).toBeEnabled();

		// update the password.
		await profilePage.page.getByText( 'Update Profile', { exact: true } ).click();

		// Wait for the navigation to complete.
		await profilePage.page.waitForURL( '/wp-admin/profile.php' );

		// Validate that the password was updated.
		await expect( profilePage.page.getByText( 'Profile updated.' ) ).toBeVisible();

		// Need to save the storage state after the password update, otherwise the next test will fail.
		// TODO: we should use a different user for this test instead of updating the password of the main user.
		await profilePage.page.context().storageState( { path: process.env.STORAGE_STATE_PATH } );
	} );
} );
