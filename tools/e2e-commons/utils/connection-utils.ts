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

	if ( ! ( await isConnected( requestUtils ) ) ) {
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

	logger.debug( 'Disconnect response:', r );
}

/**
 * Check if the site is connected.
 * @return {Promise<boolean>} True if connected, false otherwise.
 * @param  requestUtils - RequestUtils instance.
 */
export async function isConnected( requestUtils: RequestUtils ): Promise< boolean > {
	try {
		const r = await requestUtils.rest( { path: 'jetpack/v4/connection' } );
		logger.debug( 'Connection check response:', r );
		return r.isActive;
	} catch ( error ) {
		logger.error( 'Error checking connection:', error );
		return false;
	}
}
