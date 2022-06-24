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
