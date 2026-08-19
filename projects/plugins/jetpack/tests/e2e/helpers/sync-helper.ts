import logger from '@automattic/_jetpack-e2e-commons/logger';
import { executeWpCommand } from '@automattic/_jetpack-e2e-commons/utils/cli';

/**
 * Enable sync
 * @return {string} wp-cli command output
 */
export async function enableSync(): Promise< string > {
	logger.debug( 'Enabling sync' );
	return executeWpCommand( 'jetpack sync enable' );
}

/**
 * Disable sync
 * @return {string} wp-cli command output
 */
export async function disableSync(): Promise< string > {
	logger.debug( 'Disabling sync' );
	return executeWpCommand( 'jetpack sync disable' );
}

/**
 * Reset sync
 * @return {string} wp-cli command output
 */
export async function resetSync(): Promise< string > {
	logger.debug( 'Resetting sync' );
	return executeWpCommand( 'jetpack sync reset' );
}

/**
 * Reset sync locks
 * @return {string} wp-cli command output
 */
export async function resetSyncLocks(): Promise< string > {
	logger.debug( 'Resetting sync locks' );
	return executeWpCommand( [
		'eval',
		'\\Automattic\\Jetpack\\Sync\\Actions::reset_sync_locks();',
	] );
}

/**
 * Get sync status
 * @return {string} wp-cli command output
 */
export async function getSyncStatus(): Promise< string > {
	logger.debug( 'Checking sync status' );
	return executeWpCommand( 'jetpack sync status' );
}

/**
 * Enable dedicated sync
 * @return {string} wp-cli command output
 */
export async function enableDedicatedSync(): Promise< string > {
	logger.debug( 'Enabling dedicated sync' );
	return executeWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 1' );
}

/**
 * Disable dedicated sync
 * @return {string} wp-cli command output
 */
export async function disableDedicatedSync(): Promise< string > {
	logger.debug( 'Disabling dedicated sync' );
	return executeWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 0' );
}

/**
 * Test if sync queue is empty
 * @return {boolean} Whether it's empty
 */
export async function isSyncQueueEmpty(): Promise< boolean > {
	try {
		const status = await getSyncStatus();
		logger.debug( status );
		return /(^|\n)queue_size\s+0(\n|$)/.test( status );
	} catch ( e ) {
		logger.error( `isSyncQueueEmpty: ${ e }` );
		return false;
	}
}
