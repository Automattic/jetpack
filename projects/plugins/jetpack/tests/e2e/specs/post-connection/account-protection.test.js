import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { WPLoginPage } from '_jetpack-e2e-commons/pages/wp-admin/index.js';
import ProfilePage from '_jetpack-e2e-commons/pages/wp-admin/profile.js';
import {
	getAccountProtectionAuthCodeFromTransient,
	getAccountProtectionTokenFromUrl,
	insertTestUsers,
} from '../../helpers/account-protection-helper.js';
import playwrightConfig from '../../playwright.config.mjs';

const PRIVILEGED_ROLES = [ 'administrator', 'editor', 'author' ];
const NON_PRIVILEGED_ROLES = [ 'contributor', 'subscriber' ];

test.describe.parallel( 'Compromised Password Detection', () => {
	test.beforeAll( async ( { browser } ) => {
		// Set up a clean environment with account protection enabled.
		const page = await browser.newPage( playwrightConfig.use );
		await prerequisitesBuilder( page )
			.withInactiveModules( [ 'protect', 'sso' ] )
			.withActiveModules( [ 'account-protection' ] )
			.withCleanEnv()
			.withConnection( true )
			.build();

		await insertTestUsers();

		await page.close();
	} );

	test( 'Detects compromised passwords', async ( { page } ) => {
		for ( const role of PRIVILEGED_ROLES ) {
			await test.step( `Enforces account protection 2FA for ${ role } users`, async () => {
				const loginPage = await WPLoginPage.visit( page );

				// Attempt sign in.
				await loginPage.fill( '#user_login', role );
				await loginPage.fill( '#user_pass', 'password' );
				await loginPage.click( '#wp-submit' );

				// Wait for the form submission.
				await loginPage.waitForDomContentLoaded();
				await loginPage.waitForElementToBeVisible( '.action-input' );

				expect( page.url() ).toContain( 'token=' );

				// Get the token and auth code.
				const token = getAccountProtectionTokenFromUrl( page.url() );
				const authCode = await getAccountProtectionAuthCodeFromTransient( token );

				expect( authCode ).toBeTruthy();

				// Submit the auth code.
				await loginPage.fill( '.action-input', authCode );
				await loginPage.click( '.action-verify' );

				// Wait for the form submission.
				await loginPage.waitForDomContentLoaded();
				await loginPage.waitForElementToBeVisible( '.action-proceed' );

				// Proceed to wp-admin.
				await loginPage.click( '.action-proceed' );

				// Wait for the navigation to complete.
				await loginPage.waitForDomContentLoaded();
				await loginPage.waitForElementToBeHidden( '.action-proceed' );

				expect( page.url() ).toContain( '/wp-admin' );

				// Sign out.
				const accountBarSelector = '#wp-admin-bar-my-account';
				const logoutOptionSelector = '#wp-admin-bar-logout';
				await loginPage.waitForElementToBeVisible( accountBarSelector );
				await loginPage.hover( accountBarSelector );
				await loginPage.click( logoutOptionSelector );
			} );
		}

		for ( const role of NON_PRIVILEGED_ROLES ) {
			await test.step( `Bypasses account protection 2FA for ${ role } users`, async () => {
				const loginPage = await WPLoginPage.visit( page );

				// Attempt sign in.
				await loginPage.fill( '#user_login', role );
				await loginPage.fill( '#user_pass', 'password' );
				await loginPage.click( '#wp-submit' );

				// Wait for the form submission.
				await loginPage.waitForDomContentLoaded();
				await loginPage.waitForElementToBeHidden( loginPage.selectors[ 0 ] );

				expect( page.url() ).toContain( '/wp-admin' );
			} );
		}

		await test.step( `Bypasses account protection 2FA for users with secure passwords`, async () => {
			const loginPage = await WPLoginPage.visit( page );

			// Attempt sign in.
			await loginPage.fill( '#user_login', 'secure_user' );
			await loginPage.fill( '#user_pass', '87h23foi2uhfljhdakdh9812df' );
			await loginPage.click( '#wp-submit' );

			// Wait for the form submission.
			await loginPage.waitForDomContentLoaded();
			await loginPage.waitForElementToBeHidden( loginPage.selectors[ 0 ] );

			// Test successful sign in.
			expect( page.url() ).toContain( '/wp-admin' );
		} );
	} );

	test( 'Password reset after verification', async ( { page } ) => {
		const loginPage = await WPLoginPage.visit( page );

		// Attempt sign in.
		await loginPage.fill( '#user_login', 'administrator' );
		await loginPage.fill( '#user_pass', 'password' );
		await loginPage.click( '#wp-submit' );

		// Wait for the form submission.
		await loginPage.waitForDomContentLoaded();
		await loginPage.waitForElementToBeVisible( '.action-input' );

		expect( page.url() ).toContain( 'token=' );

		// Get the token and auth code.
		const token = getAccountProtectionTokenFromUrl( page.url() );
		const authCode = await getAccountProtectionAuthCodeFromTransient( token );

		// Submit the auth code.
		await loginPage.fill( '.action-input', authCode );
		await loginPage.click( '.action-verify' );

		// Wait for the form submission.
		await loginPage.waitForDomContentLoaded();
		await loginPage.waitForElementToBeVisible( '.action-update-password' );

		// Choose to update the password.
		await loginPage.click( '.action-update-password' );

		// Wait for the navigation to complete.
		await loginPage.waitForDomContentLoaded();
		await loginPage.waitForElementToBeHidden( '.action-update-password' );

		expect( page.url() ).toContain( '/profile.php#password' );
	} );
} );

test.describe.parallel( 'Strong password requirements', () => {
	test.beforeAll( async ( { browser } ) => {
		// Set up a clean environment with account protection enabled.
		const page = await browser.newPage( playwrightConfig.use );

		await prerequisitesBuilder( page )
			.withCleanEnv()
			.withLoggedIn( true )
			.withInactiveModules( [ 'protect', 'sso' ] )
			.withActiveModules( [ 'account-protection' ] )
			.withConnection( true )
			.build();

		await page.close();
	} );

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
	} );
} );
