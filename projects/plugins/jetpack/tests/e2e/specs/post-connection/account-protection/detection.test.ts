import { test, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import {
	getAccountProtectionAuthCodeFromTransient,
	getAccountProtectionTokenFromUrl,
	insertTestUsers,
	deleteTestUsers,
	submitCredentials,
	submitTheVerificationCode,
} from '../../../helpers/account-protection-helper';

const PRIVILEGED_ROLES = [ 'administrator', 'editor', 'author' ];
const NON_PRIVILEGED_ROLES = [ 'contributor', 'subscriber' ];

// Reset storage state for this file to avoid being authenticated
test.use( { storageState: { cookies: [], origins: [] } } );

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.activateModule( 'account-protection' );
	expect( await testUtils.isModuleActive( 'account-protection' ) ).toBe( true );

	await testUtils.deactivateModule( [ 'protect', 'sso' ] );
	expect( await testUtils.isModuleActive( 'protect' ) ).toBe( false );
	expect( await testUtils.isModuleActive( 'sso' ) ).toBe( false );

	await insertTestUsers();
} );

test.beforeEach( async ( { page } ) => {
	await page.context().clearCookies();
	await page.goto( '/wp-login.php' );
} );

test.afterAll( async () => {
	await deleteTestUsers();
} );

test.describe.parallel( 'Compromised Password Detection', () => {
	for ( const role of PRIVILEGED_ROLES ) {
		test( `Enforces account protection 2FA for ${ role } users`, async ( { page } ) => {
			await submitCredentials( page, role, 'password' );

			await expect(
				page.getByRole( 'textbox', { name: 'Enter verification code' } )
			).toBeVisible();

			expect( page.url() ).toContain( 'token=' );

			// Get the token and auth code.
			const token = getAccountProtectionTokenFromUrl( page.url() );
			const authCode = await getAccountProtectionAuthCodeFromTransient( token );

			expect( authCode ).toBeTruthy();

			await submitTheVerificationCode( page, authCode );

			await expect( page.getByRole( 'link', { name: 'Proceed without updating' } ) ).toBeVisible();

			// Proceed to wp-admin.
			await page.getByRole( 'link', { name: 'Proceed without updating' } ).click();

			expect( page.url() ).toContain( '/wp-admin' );
		} );
	}

	for ( const role of NON_PRIVILEGED_ROLES ) {
		test( `Bypasses account protection 2FA for ${ role } users`, async ( { page } ) => {
			await submitCredentials( page, role, 'password' );
			expect( page.url() ).toContain( '/wp-admin' );
		} );
	}

	test( `Bypasses account protection 2FA for users with secure passwords`, async ( { page } ) => {
		await submitCredentials( page, 'secure_user', '87h23foi2uhfljhdakdh9812df' );
		expect( page.url() ).toContain( '/wp-admin' );
	} );

	test( 'Password reset after verification', async ( { page } ) => {
		await submitCredentials( page, 'administrator', 'password' );

		await expect( page.getByRole( 'textbox', { name: 'Enter verification code' } ) ).toBeVisible();

		expect( page.url() ).toContain( 'token=' );

		// Get the token and auth code.
		const token = getAccountProtectionTokenFromUrl( page.url() );
		const authCode = await getAccountProtectionAuthCodeFromTransient( token );

		expect( authCode ).toBeTruthy();

		await submitTheVerificationCode( page, authCode );

		// Choose to update the password.
		await page.getByRole( 'link', { name: 'Create a new password' } ).click();

		// Wait for the navigation to complete.
		await expect( page.getByRole( 'link', { name: 'Create a new password' } ) ).toBeHidden();

		expect( page.url() ).toContain( '/profile.php#password' );
	} );
} );
