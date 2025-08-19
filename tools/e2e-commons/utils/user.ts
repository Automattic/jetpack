import logger from '../logger';
import { executeWpCommand } from './cli';

/**
 * Creates a new WordPress user using WP-CLI.
 *
 * @param user          - User object containing the user details
 * @param user.username - The username for the new user (must be unique, alphanumeric with underscores/hyphens)
 * @param user.password - The password for the new user (required)
 * @param user.role     - WordPress role for the user (e.g., 'administrator', 'editor', 'author', 'contributor', 'subscriber')
 * @return Promise that resolves when the user is created successfully
 *
 * @example
 * ```typescript
 * await createUser({
 *   username: 'testuser',
 *   password: 'SecurePass123!',
 *   role: 'subscriber'
 * });
 * ```
 */
export async function createUser( user: {
	username: string;
	password: string;
	role: string;
} ): Promise< void > {
	if ( ! user.username || typeof user.username !== 'string' ) {
		throw new Error( 'Username is required and must be a string' );
	}

	if ( ! user.password || typeof user.password !== 'string' ) {
		throw new Error( 'Password is required and must be a string' );
	}

	if ( ! user.role || typeof user.role !== 'string' ) {
		throw new Error( 'Role is required and must be a string' );
	}

	// Validate username format (alphanumeric, underscores, hyphens)
	const usernameRegex = /^[a-zA-Z0-9_-]+$/;
	if ( ! usernameRegex.test( user.username ) ) {
		throw new Error(
			'Username must contain only alphanumeric characters, underscores, and hyphens'
		);
	}

	// Log the user creation attempt
	logger.debug( `Creating WordPress user: ${ user.username } with role: ${ user.role }` );

	await executeWpCommand(
		`user create ${ user.username } ${ user.username }@example.com --role=${ user.role } --user_pass=${ user.password }`
	);
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
