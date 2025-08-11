import logger from '../logger';
import { executeWpCommand } from './cli';
import { getDotComCredentials, getSiteCredentials } from './environment';
import { partnerProvisionConnection } from './partner-provision';
import { TestUtils } from '.';

/**
 * Connect Jetpack.
 */
export async function connect() {
	const creds = getDotComCredentials();
	const siteCreds = getSiteCredentials();
	await executeWpCommand( `user update ${ siteCreds.username } --user_email=${ creds.email }` );
	if ( ! creds.userId ) {
		throw new Error( 'userId is undefined' );
	}
	await partnerProvisionConnection( creds.userId, 'free', siteCreds.username );
}

/**
 * Disconnect Jetpack.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnect( this: TestUtils ) {
	// await executeWpCommand( 'jetpack disconnect blog' );
	await disconnectUser.call( this );
	await disconnectSite.call( this );
}

/**
 * Disconnect user from WordPress.com.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectUser( this: TestUtils ) {
	if ( ! ( await isUserConnected.call( this ) ) ) {
		logger.debug( 'User is not connected, no need to disconnect.' );
		return;
	}

	// Unlink current user from the related WordPress.com account.
	// `linked` as `false` will disconnect the site.
	const r = await this.requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection/user',
		data: {
			'disconnect-all-users': true,
			force: true,
			linked: false,
		},
	} );

	logger.debug( `User disconnection response: ${ JSON.stringify( r ) }` );
}

/**
 * Disconnect Jetpack installation from WordPress.com.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectSite( this: TestUtils ) {
	if ( ! ( await isSiteConnected.call( this ) ) ) {
		logger.debug( 'Site is not connected, no need to disconnect.' );
		return;
	}

	const r = await this.requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection',
		data: {
			isActive: false,
		},
	} );

	logger.debug( `Site disconnection response: ${ JSON.stringify( r ) }` );
}

/**
 * Check if the site is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 */
export async function isSiteConnected( this: TestUtils ): Promise< boolean > {
	try {
		const r = await this.requestUtils.rest( { path: 'jetpack/v4/connection' } );
		logger.debug( `Site connection check response: ${ JSON.stringify( r ) }` );
		return r.isActive;
	} catch ( error ) {
		logger.error( `Error checking site connection: ${ error }` );
		return false;
	}
}

/**
 * Check if the user is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 */
export async function isUserConnected( this: TestUtils ): Promise< boolean > {
	try {
		const r = await this.requestUtils.rest( { path: 'jetpack/v4/connection/data' } );
		logger.debug( `User connection check response: ${ JSON.stringify( r ) }` );
		return r.currentUser.isConnected;
	} catch ( error ) {
		logger.error( `Error checking user connection: ${ error }` );
		return false;
	}
}
