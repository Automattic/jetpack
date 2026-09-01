import { executeJetpackCommand } from './cli';

/**
 * Activates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to activate
 * @return {Promise<void>}
 */
export async function activateModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackCommand( `module activate ${ mod }` );
	}
}

/**
 * Deactivates one or more Jetpack modules
 *
 * @param {string|string[]} modules - Jetpack module name(s) to deactivate
 * @return {Promise<void>}
 */
export async function deactivateModule( modules: string | string[] ): Promise< void > {
	const moduleArray = Array.isArray( modules ) ? modules : [ modules ];
	for ( const mod of moduleArray ) {
		await executeJetpackCommand( `module deactivate ${ mod }` );
	}
}

/**
 * Check if a module is active.
 * @param {string} module - Module name to check
 * @return {Promise<boolean>} If active
 */
export async function isModuleActive( module: string ): Promise< boolean > {
	const result = await executeJetpackCommand( `options get active_modules` );
	if ( typeof result !== 'string' ) {
		return false;
	}

	// Parse the PHP array output to extract module names
	const moduleMatches = result.match( /\[\d+\] => (.+)/g );
	if ( ! moduleMatches ) {
		return false;
	}

	const activeModules = moduleMatches
		.map( match => {
			const moduleMatch = match.match( /\[\d+\] => (.+)/ );
			return moduleMatch ? moduleMatch[ 1 ].trim() : '';
		} )
		.filter( Boolean );

	return activeModules.includes( module );
}
