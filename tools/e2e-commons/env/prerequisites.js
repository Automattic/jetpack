import assert from 'assert';
import { execWpCommand, isLocalSite, resetWordpressInstall } from '../helpers/utils-helper.js';
import logger from '../logger.js';

/**
 * Create a prerequisites builder.
 * @param {page} page - Playwright page instance.
 * @return {object} Builder
 */
export function prerequisitesBuilder( page ) {
	const state = {
		clean: undefined,
		plugins: { active: undefined, inactive: undefined },
	};

	return {
		withActivePlugins( plugins = [] ) {
			state.plugins.active = plugins;
			return this;
		},
		withInactivePlugins( plugins = [] ) {
			state.plugins.inactive = plugins;
			return this;
		},
		withCleanEnv() {
			state.clean = true;
			return this;
		},
		async build() {
			await buildPrerequisites( state, page );
		},
	};
}

/**
 * Build prerequisites.
 * @param {object}  state           - State
 * @param {boolean} state.clean     - Whether to reset the environment.
 * @param {boolean} state.connected - Whether the site should be connected.
 * @param {object}  state.plugins   - Plugins state, see ensurePluginsState()
 * @param {object}  state.modules   - Modules state, see ensureModulesState()
 * @param {page}    page            - Playwright page instance.
 */
// eslint-disable-next-line no-unused-vars
async function buildPrerequisites( state, page ) {
	const functions = {
		plugins: () => ensurePluginsState( state.plugins ),
		clean: () => ensureCleanState( state.clean ),
	};

	logger.prerequisites( JSON.stringify( state, null, 2 ) );

	for ( const option of Object.keys( state ) ) {
		if ( state[ option ] !== undefined ) {
			if ( functions[ option ] ) {
				logger.prerequisites( `Ensuring '${ option }' prerequisite state` );
				await functions[ option ]();
			} else {
				throw Error( `Unknown state "${ option }: ${ state[ option ] }"!` );
			}
		}
	}
}

/**
 * Reset environment.
 * @param {boolean} shouldReset - Whether to actually do it.
 */
async function ensureCleanState( shouldReset ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites( 'Site is not local, skipping environment reset.' );
		return;
	}

	if ( shouldReset ) {
		logger.prerequisites( 'Resetting environment' );
		await execWpCommand( 'jetpack disconnect blog' );
		await resetWordpressInstall();
	}
}

/**
 * Ensure plugins are active/inactive
 * @param {object}   plugins          - State
 * @param {string[]} plugins.active   - Plugins to activate.
 * @param {string[]} plugins.inactive - Plugins to deactivate.
 */
export async function ensurePluginsState( plugins ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites( 'Site is not local, skipping plugins setup.' );
		return;
	}

	if ( plugins.active ) {
		await activatePlugins( plugins.active );
	} else {
		logger.prerequisites( 'Cannot find list of plugins to activate!' );
	}

	if ( plugins.inactive ) {
		await deactivatePlugins( plugins.inactive );
	} else {
		logger.prerequisites( 'Cannot find list of plugins to deactivate!' );
	}
}

/**
 * Activate plugins.
 * @param {string[]} pluginsList - Plugin slugs
 */
async function activatePlugins( pluginsList ) {
	const activatedPlugins = [];
	for ( const plugin of pluginsList ) {
		logger.prerequisites( `Activating plugin ${ plugin }` );
		const result = await execWpCommand( `plugin activate ${ plugin }` );
		const txt = result.toString();
		if (
			txt.includes( `Plugin '${ plugin }' activated.` ) ||
			txt.includes( `Plugin '${ plugin }' is already active.` )
		) {
			activatedPlugins.push( plugin );
		}
	}
	assert.equal( pluginsList.length, activatedPlugins.length );
}

/**
 * Deactivate plugins
 * @param {string[]} pluginsList - Plugin slugs
 */
async function deactivatePlugins( pluginsList ) {
	const deactivatedPlugins = [];
	for ( const plugin of pluginsList ) {
		logger.prerequisites( `Deactivating plugin ${ plugin }` );
		const result = await execWpCommand( `plugin deactivate ${ plugin }` );
		const txt = result.toString();
		if (
			txt.includes( `Plugin '${ plugin }' deactivated.` ) ||
			txt.includes( `Plugin '${ plugin }' isn't active.` )
		) {
			deactivatedPlugins.push( plugin );
		}
	}
	assert.equal( pluginsList.length, deactivatedPlugins.length );
}

/**
 * Check if blog token is set.
 * @return {boolean} If set.
 */
export async function isBlogTokenSet() {
	const cliCmd = 'jetpack options get blog_token';
	const result = await execWpCommand( cliCmd );
	if ( typeof result !== 'object' ) {
		return true;
	}
	const txt = result.toString();
	if (
		txt.includes( 'Error: Option not found or is empty' ) ||
		txt.includes( "Error: 'jetpack' is not a registered wp command" )
	) {
		return false;
	}
	return false;
}
