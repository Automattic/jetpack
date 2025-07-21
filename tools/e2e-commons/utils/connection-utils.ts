import fs from 'fs';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import { provisionJetpackStartConnection } from '../helpers/partner-provisioning';
import { execWpCommand, getDotComCredentials, getSiteCredentials } from '../helpers/utils-helper';
import logger from '../logger';

/**
 * Connect Jetpack.
 */
export async function connect() {
	const creds = getDotComCredentials();
	const siteCreds = getSiteCredentials();
	await execWpCommand( `user update ${ siteCreds.username } --user_email=${ creds.email }` );

	await provisionJetpackStartConnection( creds.userId, 'free', siteCreds.username );
}

/**
 * Save Jetpack private options to storage state.
 */
export async function saveJetpackPrivateOptionsToStorageState() {
	// We are connected. Let's save the existing connection options just in case.
	const result = await execWpCommand( 'option get jetpack_private_options --format=json' );
	fs.writeFileSync(
		`${ process.env.STORAGE_STATE_DIR_PATH }/jetpack_private_options.json`,
		result.trim()
	);
}

/**
 * Disconnect Jetpack.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnect( requestUtils: RequestUtils ) {
	// await execWpCommand( 'jetpack disconnect blog' );
	await disconnectUser( requestUtils );
	await disconnectSite( requestUtils );
}

/**
 * Disconnect user from WordPress.com.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectUser( requestUtils: RequestUtils ) {
	if ( ! ( await isUserConnected( requestUtils ) ) ) {
		logger.debug( 'User is not connected, no need to disconnect.' );
		return;
	}

	// Unlink current user from the related WordPress.com account.
	// `linked` as `false` will disconnect the site.
	const r = await requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection/user',
		data: {
			'disconnect-all-users': true,
			force: true,
			linked: false,
		},
	} );

	logger.debug( `User disconnection response: ${ r }` );
}

/**
 * Disconnect Jetpack installation from WordPress.com.
 * @param  requestUtils - RequestUtils instance.
 * @return {Promise<void>} Resolves when the disconnect is complete.
 */
export async function disconnectSite( requestUtils: RequestUtils ) {
	if ( ! ( await isSiteConnected( requestUtils ) ) ) {
		logger.debug( 'Site is not connected, no need to disconnect.' );
		return;
	}

	const r = await requestUtils.rest( {
		method: 'POST',
		path: '/jetpack/v4/connection',
		data: {
			isActive: false,
		},
	} );

	logger.debug( `Site disconnection response: ${ r }` );
}

/**
 * Check if the site is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 * @param  requestUtils - RequestUtils instance.
 */
export async function isSiteConnected( requestUtils: RequestUtils ): Promise< boolean > {
	try {
		const r = await requestUtils.rest( { path: 'jetpack/v4/connection' } );
		logger.debug( `Site connection check response: ${ r }` );
		return r.isActive;
	} catch ( error ) {
		logger.error( `Error checking site connection: ${ error }` );
		return false;
	}
}

/**
 * Check if the user is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 * @param  requestUtils - RequestUtils instance.
 */
export async function isUserConnected( requestUtils: RequestUtils ): Promise< boolean > {
	try {
		const r = await requestUtils.rest( { path: 'jetpack/v4/connection/data' } );
		logger.debug( `User connection check response: ${ r }` );
		return r.currentUser.isConnected;
	} catch ( error ) {
		logger.error( `Error checking user connection: ${ error }` );
		return false;
	}
}
