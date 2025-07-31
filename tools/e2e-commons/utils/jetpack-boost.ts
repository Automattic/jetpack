import { executeJetpackBoostCommand } from './cli';

/**
 * Activates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to activate
 * @return {Promise<void>}
 */
export async function activateBoostModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackBoostCommand( `module activate ${ mod }`, true );
	}
}

/**
 * Deactivates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to deactivate
 * @return {Promise<void>}
 */
export async function deactivateBoostModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackBoostCommand( `module deactivate ${ mod }`, true );
	}
}
