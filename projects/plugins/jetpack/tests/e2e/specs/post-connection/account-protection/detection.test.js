import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { WPLoginPage } from '_jetpack-e2e-commons/pages/wp-admin/index.js';
import {
	getAccountProtectionAuthCodeFromTransient,
	getAccountProtectionTokenFromUrl,
	insertTestUsers,
} from '../../../helpers/account-protection-helper.js';
import playwrightConfig from '../../../playwright.config.mjs';

const PRIVILEGED_ROLES = [ 'administrator', 'editor', 'author' ];
const NON_PRIVILEGED_ROLES = [ 'contributor', 'subscriber' ];

// Reset storage state for this file to avoid being authenticated
test.use( { storageState: { cookies: [], origins: [] } } );

test.beforeAll( async ( { browser } ) => {
	// Set up a clean environment with account protection enabled.
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withInactiveModules( [ 'protect', 'sso' ] )
		.withActiveModules( [ 'account-protection' ] )
		.build();

	await insertTestUsers();

	await page.close();
} );

test.describe.parallel( 'Compromised Password Detection', () => {
	test.beforeAll( async ( {} ) => {
		await insertTestUsers();
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
