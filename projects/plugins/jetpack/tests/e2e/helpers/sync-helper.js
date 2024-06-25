import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.js';
import logger from 'jetpack-e2e-commons/logger.js';

/**
 * Enable sync
 * @returns {string} wp-cli command output
 */
export async function enableSync() {
	logger.sync( 'Enabling sync' );
	return execWpCommand( 'jetpack sync enable' );
}

/**
 * Disable sync
 * @returns {string} wp-cli command output
 */
export async function disableSync() {
	logger.sync( 'Disabling sync' );
	return execWpCommand( 'jetpack sync disable' );
}

/**
 * Reset sync
 * @returns {string} wp-cli command output
 */
export async function resetSync() {
	logger.sync( 'Resetting sync' );
	return execWpCommand( 'jetpack sync reset' );
}

/**
 * Get sync status
 * @returns {string} wp-cli command output
 */
export async function getSyncStatus() {
	logger.sync( 'Checking sync status' );
	return execWpCommand( 'jetpack sync status' );
}

/**
 * Enable dedicated sync
 * @returns {string} wp-cli command output
 */
export async function enableDedicatedSync() {
	logger.sync( 'Enabling dedicated sync' );
	return execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 1' );
}

/**
 * Disable dedicated sync
 * @returns {string} wp-cli command output
 */
export async function disableDedicatedSync() {
	logger.sync( 'Disabling dedicated sync' );
	return execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 0' );
}

/**
 * Test if sync queue is empty
 * @returns {boolean} Whether it's empty
 */
export async function isSyncQueueEmpty() {
	try {
		const status = await getSyncStatus();
		logger.sync( status );
		return status.includes( 'queue_size' ) && status.includes( 'queue_size	0' );
	} catch ( e ) {
		logger.error( `isSyncQueueEmpty: ${ e }` );
		return false;
	}
}
