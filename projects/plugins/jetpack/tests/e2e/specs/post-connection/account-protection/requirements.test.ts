import { test as baseTest, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { submitCredentials } from '../../../helpers/account-protection-helper';

const test = baseTest.extend< {
	testUser: { username: string; password: string; role: string };
} >( {
	storageState: { cookies: [], origins: [] },
	testUser: async ( { testUtils }, use ) => {
		const user = await testUtils.createUser();
		await use( user );
		await testUtils.deleteUser( user.username );
	},
} );

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.activateModule( 'account-protection' );
	expect( await testUtils.isModuleActive( 'account-protection' ) ).toBe( true );

	await testUtils.deactivateModule( [ 'protect', 'sso' ] );
	expect( await testUtils.isModuleActive( 'protect' ) ).toBe( false );
	expect( await testUtils.isModuleActive( 'sso' ) ).toBe( false );
} );

test.describe.parallel( 'Strong password requirements', () => {
	test( 'Enforces strong password requirements', async ( { page, testUser } ) => {
		await test.step( 'Navigate to profile page and login', async () => {
			await page.goto( '/wp-admin/profile.php' );
			await submitCredentials( page, testUser.username, testUser.password );
			await page.waitForLoadState();
		} );

		await test.step( 'Initialize password change', async () => {
			await page.getByRole( 'button', { name: 'Set New Password' } ).click();
		} );

		await test.step( 'Verify Jetpack password strength meter is active', async () => {
			await expect( page.locator( '.strength-meter' ) ).toBeVisible();
			await expect( page.locator( '#pass-strength-result' ) ).toBeHidden();
			await expect( page.getByRole( 'checkbox', { name: 'pw_weak' } ) ).toBeHidden();

			await expect( page.locator( '#pass1' ) ).not.toBeEmpty();
			await expect(
				page.locator( '.strength-meter' ).filter( { hasNotText: 'Validating' } )
			).toBeVisible();
		} );

		await test.step( 'Enter weak password', async () => {
			const passwordInput = page.locator( '#pass1' );
			await passwordInput.fill( 'password' );
			await passwordInput.evaluate( input => {
				input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
			} );
		} );

		await test.step( 'Verify password strength validation', async () => {
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
		} );

		await test.step( 'Verify weak password confirmation required', async () => {
			await expect( page.getByText( 'Confirm use of weak password' ) ).toBeVisible();
			await expect( page.getByText( 'Update Profile', { exact: true } ) ).toBeDisabled();
		} );

		await test.step( 'Confirm weak password usage', async () => {
			await page.locator( '.pw-checkbox' ).check();
			await expect( page.getByText( 'Update Profile', { exact: true } ) ).toBeEnabled();
		} );

		await test.step( 'Update password profile', async () => {
			await page.getByText( 'Update Profile', { exact: true } ).click();
			await page.waitForURL( '/wp-admin/profile.php' );
		} );

		await test.step( 'Verify profile update success', async () => {
			await expect( page.getByText( 'Profile updated.' ) ).toBeVisible();
		} );
	} );
} );
