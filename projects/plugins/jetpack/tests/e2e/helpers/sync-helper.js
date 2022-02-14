import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import logger from 'jetpack-e2e-commons/logger.cjs';

export async function enableSync() {
	return await execWpCommand( 'jetpack sync enable' );
}

export async function disableSync() {
	return await execWpCommand( 'jetpack sync disable' );
}

export async function getSyncStatus() {
	return await execWpCommand( 'jetpack sync status' );
}

export async function enableDedicatedSync() {
	return await execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 1' );
}

export async function disableDedicatedSync() {
	return await execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 0' );
}

export async function isSyncQueueEmpty() {
	const status = await getSyncStatus();

	return status.includes( 'queue_size' ) && status.includes( 'queue_size	0' );
}

/**
 * Wait till the Sync Queue is empty or a certain timeout has been reached.
 *
 * @param {number} [timeoutMs=10000] - The timeout to stop checking if the Sync Queue is empty.
 */
export async function waitTillSyncQueueisEmpty( timeoutMs = 10000 ) {
	return new Promise( ( resolve, reject ) => {
		const timeWas = new Date();
		const wait = setInterval( function () {
			if ( isSyncQueueEmpty() ) {
				logger.action(
					`waitTillSyncQueueisEmpty: Sync Queue is empty after ${ new Date() - timeWas } ms`
				);
				clearInterval( wait );
				resolve();
			} else if ( new Date() - timeWas > timeoutMs ) {
				// Timeout
				logger.warn( `waitTillSyncQueueisEmpty: Timeout after ${ new Date() - timeWas } ms` );
				clearInterval( wait );
				reject();
			}
		}, 20 );
	} );
}
