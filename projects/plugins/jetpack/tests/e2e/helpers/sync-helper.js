import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export async function enableSync() {
	return await execWpCommand( 'jetpack sync enable' );
}

export async function disableSync() {
	return await execWpCommand( 'jetpack sync disable' );
}

export async function enableDedicatedSync() {
	return await execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 1' );
}

export async function disableDedicatedSync() {
	return await execWpCommand( 'option update jetpack_sync_settings_dedicated_sync_enabled 0' );
}
