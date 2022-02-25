import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import logger from 'jetpack-e2e-commons/logger.cjs';

export async function enableSync() {
	return execWpCommand( 'jetpack sync enable' );
}

export async function disableSync() {
	return execWpCommand( 'jetpack sync disable' );
}

export async function getSyncStatus() {
	return execWpCommand( 'jetpack sync status' );
}

export async function enableDedicatedSync() {
	return execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 1' );
}

export async function disableDedicatedSync() {
	return execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 0' );
}

export async function isSyncQueueEmpty() {
	try {
		const status = await getSyncStatus();

		return status.includes( 'queue_size' ) && status.includes( 'queue_size	0' );
	} catch ( e ) {
		logger.error( `isSyncQueueEmpty: ${ e }` );
		return false;
	}
}

/**
 * Wait till the Sync Queue is empty.
 *
 * @param {number} [interval=1000]  - The time we want to wait between
 *                                  checking if the Sync Queue is empty.
 * @param {number} [maxAttempts=10] - An upper bound for the number of
 *                                  attempts to check if the Sync Queue is empty.
 */
export async function waitTillSyncQueueIsEmpty( interval = 1000, maxAttempts = 10 ) {
	logger.action( `Waiting for Sync Queue to empty [maxAttempts: ${ maxAttempts }]` );

	let attempts = 0;

	const executeWait = async ( resolve, reject ) => {
		const isEmpty = await isSyncQueueEmpty();
		attempts++;

		if ( true === isEmpty ) {
			logger.info( `waitTillSyncQueueisEmpty: Sync Queue is empty after ${ attempts } attempts` );
			return resolve();
		} else if ( maxAttempts && attempts === maxAttempts ) {
			logger.warn( `waitTillSyncQueueisEmpty: Exceeded max attempts ( ${ maxAttempts } )` );
			return reject();
		}
		setTimeout( executeWait, interval, resolve, reject );
	};

	return new Promise( executeWait );
}
