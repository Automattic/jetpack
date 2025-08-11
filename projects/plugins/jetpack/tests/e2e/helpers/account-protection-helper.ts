import logger from '_jetpack-e2e-commons/logger.js';
import { executeWpCommand } from '_jetpack-e2e-commons/utils/cli.ts';
import type { Page } from '@playwright/test';

const PRIVILEGED_ROLES = [ 'administrator', 'editor', 'author' ];
const NON_PRIVILEGED_ROLES = [ 'contributor', 'subscriber' ];

/**
 * Enable automatic rules
 * @return {Promise<void>} wp-cli 'jetpack-waf generate_rules' command output
 */
export async function insertTestUsers(): Promise< void > {
	logger.debug( 'Inserting test users' );

	// Create user accounts with compromised passwords.
	for ( const role of [ ...PRIVILEGED_ROLES, ...NON_PRIVILEGED_ROLES ] ) {
		await executeWpCommand(
			`user create ${ role } ${ role }@example.com --role=${ role } --user_pass=password`
		);
	}

	// Create a user with a secure password.
	await executeWpCommand(
		`user create secure_user secure_user@example.com --role=administrator --user_pass=87h23foi2uhfljhdakdh9812df`
	);
}

/**
 * Delete test users created by insertTestUsers
 * @return {Promise<void>} wp-cli 'user delete' command output
 */
export async function deleteTestUsers(): Promise< void > {
	logger.debug( 'Deleting test users' );

	// Delete users by role name
	for ( const role of [ ...PRIVILEGED_ROLES, ...NON_PRIVILEGED_ROLES ] ) {
		try {
			await executeWpCommand( `user delete ${ role } --yes` );
		} catch {
			logger.debug( `User ${ role } not found or already deleted` );
		}
	}

	// Delete the secure user
	try {
		await executeWpCommand( `user delete secure_user --yes` );
	} catch {
		logger.debug( `User secure_user not found or already deleted` );
	}
}

/**
 * Get account protection token from URL
 * @param {string} url - The URL to get the token from
 * @return {string} account protection token
 */
export function getAccountProtectionTokenFromUrl( url: string ): string | null {
	const queryParams = new URLSearchParams( url.split( '?' )[ 1 ] );
	return queryParams.get( 'token' );
}

/**
 * Get account protection auth code from transient
 * @param {string} token - The token to get the auth code from
 * @return {Promise<string>} account protection auth code
 */
export async function getAccountProtectionAuthCodeFromTransient(
	token: string | null
): Promise< string > {
	const transient = await executeWpCommand(
		`transient get jetpack_account_protection_${ token } --format=json`
	);
	logger.info( `Transient: ${ transient }` );
	console.log( `Transient: ${ transient }` );
	const { auth_code } = JSON.parse( transient );

	return auth_code;
}

/**
 * Submits the credentials on the login page.
 * @param {Page}   page     - The Playwright page object.
 * @param {string} username - The username to log in with.
 * @param {string} password - The password to log in with.
 * @return {Promise<void>} Resolves when the login is complete.
 */
export async function submitCredentials(
	page: Page,
	username: string,
	password: string
): Promise< void > {
	await page.getByRole( 'textbox', { name: 'Username or Email Address' } ).fill( username );
	await page.getByRole( 'textbox', { name: 'Password' } ).fill( password );
	await page.getByRole( 'button', { name: 'Log In' } ).click();
}

/**
 * Submits the verification code on the account protection page.
 * @param {Page}   page     - The Playwright page object.
 * @param {string} authCode - The verification code to submit.
 * @return {Promise<void>} Resolves when the verification code is submitted.
 */
export async function submitTheVerificationCode( page: Page, authCode: string ): Promise< void > {
	await page.getByRole( 'textbox', { name: 'Enter verification code' } ).fill( authCode );
	await page.getByRole( 'button', { name: 'Verify' } ).click();
}
