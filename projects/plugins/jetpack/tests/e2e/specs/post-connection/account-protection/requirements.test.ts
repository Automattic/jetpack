import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.activateModule( 'account-protection' );
	expect( await testUtils.isModuleActive( 'account-protection' ) ).toBe( true );

	await testUtils.deactivateModule( [ 'protect', 'sso' ] );
	expect( await testUtils.isModuleActive( 'protect' ) ).toBe( false );
	expect( await testUtils.isModuleActive( 'sso' ) ).toBe( false );
} );

test.describe.parallel( 'Strong password requirements', () => {
	test( 'Enforces strong password requirements', async ( { page } ) => {
		await page.goto( '/wp-admin/profile.php' );

		await page.getByRole( 'button' ).filter( { hasText: 'set new password' } ).click();

		// Validate that the Jetpack password strength meter replaces the default one.
		await expect( page.locator( '.strength-meter' ) ).toBeVisible();
		await expect( page.locator( '#pass-strength-result' ) ).toBeHidden();
		await expect( page.getByRole( 'checkbox', { name: 'pw_weak' } ) ).toBeHidden();

		// Wait for the default password to be validated.
		await expect( page.locator( '#pass1' ) ).not.toBeEmpty();
		await expect(
			page.locator( '.strength-meter' ).filter( { hasNotText: 'Validating' } )
		).toBeVisible();

		// Enter a weak password.
		const passwordInput = page.locator( '#pass1' );
		await passwordInput.fill( 'password' );
		await passwordInput.evaluate( input => {
			input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		} );

		// Validate that the Jetpack password strength meter displays "Weak".
		await expect( page.locator( '.strength-meter' ).getByText( 'Weak' ) ).toBeVisible();
		await expect( page.getByText( 'Strong password' ) ).toHaveCSS( 'color', 'rgb(230, 80, 84)' );
		await expect( page.getByText( 'Not a leaked password' ) ).toHaveCSS(
			'color',
			'rgb(230, 80, 84)'
		);
		await expect( page.getByText( 'Between 6 and 150 characters' ) ).toHaveCSS(
			'color',
			'rgb(0, 135, 16)'
		);
		await expect( page.getByText( "Doesn't match existing user data" ) ).toHaveCSS(
			'color',
			'rgb(0, 135, 16)'
		);
		await expect( page.getByText( 'Not used recently' ) ).toHaveCSS( 'color', 'rgb(0, 135, 16)' );

		await expect( page.getByText( 'Confirm use of weak password' ) ).toBeVisible();
		await expect( page.getByText( 'Update Profile', { exact: true } ) ).toBeDisabled();

		// check the checkbox to disable the weak password.
		await page.locator( '.pw-checkbox' ).check();

		await expect( page.getByText( 'Update Profile', { exact: true } ) ).toBeEnabled();

		// update the password.
		await page.getByText( 'Update Profile', { exact: true } ).click();

		// Wait for the navigation to complete.
		await page.waitForURL( '/wp-admin/profile.php' );

		// Validate that the password was updated.
		await expect( page.getByText( 'Profile updated.' ) ).toBeVisible();

		// Need to save the storage state after the password update, otherwise the next test will fail.
		// TODO: we should use a different user for this test instead of updating the password of the main user.
		await page.context().storageState( { path: process.env.STORAGE_STATE_PATH } );
	} );
} );
