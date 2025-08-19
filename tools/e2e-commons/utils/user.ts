import logger from '../logger';
import { executeWpCommand } from './cli';

/**
 * Creates a new WordPress user using WP-CLI.
 *
 * @param user          - Optional user object containing the user details
 * @param user.username - The username for the new user (optional, will be generated if not provided)
 * @param user.password - The password for the new user (optional, will be generated if not provided)
 * @param user.email    - The email address for the new user (optional, will be generated if not provided)
 * @param user.role     - WordPress role for the user (optional, defaults to 'subscriber')
 * @return Promise that resolves with the complete user object including any generated values
 *
 * @example
 * ```typescript
 * // Create user with all specified properties
 * const user1 = await createUser({
 *   username: 'testuser',
 *   password: 'SecurePass123!',
 *   email: 'testuser@example.com',
 *   role: 'subscriber'
 * });
 *
 * // Create user with generated properties
 * const user2 = await createUser({});
 * console.log(user2.username); // e.g., 'user_a3b2c1'
 * ```
 */
export async function createUser( user?: {
	username?: string;
	password?: string;
	email?: string;
	role?: string;
} ): Promise< { username: string; password: string; email: string; role: string } > {
	const timestamp = Date.now().toString( 36 );
	const finalUser = {
		username: user?.username || `user_${ timestamp }`,
		password: user?.password || `Pass_${ timestamp }!`,
		email: user?.email || `user_${ timestamp }@example.com`,
		role: user?.role || 'subscriber',
	};

	// Validate username format (alphanumeric, underscores, hyphens)
	const usernameRegex = /^[a-zA-Z0-9_-]+$/;
	if ( ! usernameRegex.test( finalUser.username ) ) {
		throw new Error(
			'Username must contain only alphanumeric characters, underscores, and hyphens'
		);
	}

	logger.debug( `Creating WordPress user: ${ finalUser.username } with role: ${ finalUser.role }` );

	await executeWpCommand(
		`user create ${ finalUser.username } ${ finalUser.email } --role=${ finalUser.role } --user_pass=${ finalUser.password }`
	);

	return finalUser;
}

/**
 * Deletes a WordPress user using WP-CLI.
 * @param username - The username of the user to delete
 */
export async function deleteUser( username: string ) {
	if ( ! username || typeof username !== 'string' ) {
		throw new Error( 'Username is required and must be a string' );
	}

	// Log the user deletion attempt
	logger.debug( `Deleting WordPress user: ${ username }` );

	await executeWpCommand( `user delete ${ username } --yes` );
}
