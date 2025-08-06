import { executeWpCommand } from '_jetpack-e2e-commons/utils/cli.ts';

/**
 * Executes a Jetpack Boost CLI command.
 *
 * @param {string | string[]} command - Jetpack Boost CLI command (without 'jetpack-boost' prefix)
 * @return {Promise<string>} Command output
 */
export async function executeJetpackBoostCommand( command: string | string[] ): Promise< string > {
	if ( Array.isArray( command ) ) {
		return executeWpCommand( [ 'jetpack-boost', ...command ] );
	}
	return executeWpCommand( `jetpack-boost ${ command }` );
}

/**
 * Activates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to activate
 * @return {Promise<void>}
 */
export async function activateBoostModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackBoostCommand( `module activate ${ mod }` );
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
		await executeJetpackBoostCommand( `module deactivate ${ mod }` );
	}
}
