import logger from '_jetpack-e2e-commons/logger.js';
import { executeWpCommand } from '_jetpack-e2e-commons/utils/cli.ts';

const PRIVILEGED_ROLES = [ 'administrator', 'editor', 'author' ];
const NON_PRIVILEGED_ROLES = [ 'contributor', 'subscriber' ];

/**
 * Enable automatic rules
 * @return {Promise<void>} wp-cli 'jetpack-waf generate_rules' command output
 */
export async function insertTestUsers() {
	logger.sync( 'Inserting test users' );

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
export async function deleteTestUsers() {
	logger.sync( 'Deleting test users' );

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
export function getAccountProtectionTokenFromUrl( url ) {
	const queryParams = new URLSearchParams( url.split( '?' )[ 1 ] );
	return queryParams.get( 'token' );
}

/**
 * Get account protection auth code from transient
 * @param {string} token - The token to get the auth code from
 * @return {Promise<string>} account protection auth code
 */
export async function getAccountProtectionAuthCodeFromTransient( token ) {
	const transient = await executeWpCommand(
		`transient get jetpack_account_protection_${ token } --format=json`
	);
	logger.info( `Transient: ${ transient }` );
	console.log( `Transient: ${ transient }` );
	const { auth_code } = JSON.parse( transient );

	return auth_code;
}
