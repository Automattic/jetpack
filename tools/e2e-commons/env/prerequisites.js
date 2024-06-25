import assert from 'assert';
import fs from 'fs';
import config from 'config';
import { syncJetpackPlanData, loginToWpCom, loginToWpSite } from '../flows/index.js';
import { provisionJetpackStartConnection } from '../helpers/partner-provisioning.js';
import {
	execWpCommand,
	getDotComCredentials,
	isLocalSite,
	resetWordpressInstall,
} from '../helpers/utils-helper.js';
import logger from '../logger.js';

/**
 * Create a prerequisites builder.
 * @param {page} page - Playwright page instance.
 * @returns {object} Builder
 */
export function prerequisitesBuilder( page ) {
	const state = {
		clean: undefined,
		plugins: { active: undefined, inactive: undefined },
		loggedIn: undefined,
		wpComLoggedIn: undefined,
		connected: undefined,
		plan: undefined,
		modules: { active: undefined, inactive: undefined },
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
		withLoggedIn( shouldBeLoggedIn ) {
			state.loggedIn = shouldBeLoggedIn;
			return this;
		},
		withWpComLoggedIn( shouldBeLoggedIn ) {
			state.wpComLoggedIn = shouldBeLoggedIn;
			return this;
		},
		withConnection( shouldBeConnected ) {
			state.connected = shouldBeConnected;
			return this;
		},
		withPlan( plan ) {
			state.plan = plan;
			return this;
		},
		withActiveModules( modules = [] ) {
			state.modules.active = modules;
			return this;
		},
		withInactiveModules( modules = [] ) {
			state.modules.inactive = modules;
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
 * @param {object} state - State
 * @param {boolean} state.clean - Whether to reset the environment.
 * @param {boolean} state.connected - Whether the site should be connected.
 * @param {object} state.plugins - Plugins state, see ensurePluginsState()
 * @param {object} state.modules - Modules state, see ensureModulesState()
 * @param {page} page - Playwright page instance.
 */
async function buildPrerequisites( state, page ) {
	const functions = {
		plugins: () => ensurePluginsState( state.plugins ),
		loggedIn: () => ensureUserIsLoggedIn( page ),
		wpComLoggedIn: () => ensureWpComUserIsLoggedIn( page ),
		connected: () => ensureConnectedState( state.connected ),
		plan: () => ensurePlan( state.plan, page ),
		modules: () => ensureModulesState( state.modules ),
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
 * Ensure connected state.
 * @param {boolean} requiredConnected - Whether the site should be connected.
 */
export async function ensureConnectedState( requiredConnected = false ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites(
			'Site is not local, skipping connection setup. Assuming required setup is already in place.'
		);
		return;
	}

	const isConnected = await isBlogTokenSet();

	if ( requiredConnected && isConnected ) {
		logger.prerequisites( 'Already connected, moving on' );
	} else if ( requiredConnected && ! isConnected ) {
		logger.prerequisites( 'Connecting Jetpack' );
		await connect();
	} else if ( ! requiredConnected && isConnected ) {
		logger.prerequisites( 'Disconnecting Jetpack' );
		await disconnect();
	} else {
		logger.prerequisites( 'Already disconnected, moving on' );
	}
}

/**
 * Connect Jetpack.
 */
async function connect() {
	const creds = getDotComCredentials();
	await execWpCommand( `user update wordpress --user_email=${ creds.email }` );

	try {
		provisionJetpackStartConnection( creds.userId, 'free' );
	} catch ( error ) {
		// Let's try to re-try the provisioning if it fails the first time.
		if ( error.message.startsWith( 'Jetpack Start provisioning failed' ) ) {
			provisionJetpackStartConnection( creds.userId, 'free' );
		} else {
			throw error;
		}
	}
	assert.ok( await isBlogTokenSet() );

	// We are connected. Let's save the existing connection options just in case.
	const result = await execWpCommand( 'option get jetpack_private_options --format=json' );
	fs.writeFileSync( config.get( 'temp.jetpackPrivateOptions' ), result.trim() );
}

/**
 * Disconnect Jetpack.
 */
async function disconnect() {
	await execWpCommand( 'option delete jetpack_private_options' );
	await execWpCommand( 'option delete jetpack_sync_error_idc' );

	assert.ok( ! ( await isBlogTokenSet() ) );
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
 * Ensure plan.
 * @param {string} plan - Plan slug.
 * @param {page} page - Playwright page instance.
 */
export async function ensurePlan( plan = undefined, page ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites(
			'Site is not local, skipping plan setup. Assuming required plan is already in place.'
		);
		return;
	}

	if ( [ 'free', 'complete' ].indexOf( plan ) < 0 ) {
		throw new Error( `Unsupported plan ${ plan }` );
	}

	await syncJetpackPlanData( page, plan, true );
}

/**
 * Ensure user is logged in.
 * @param {page} page - Playwright page instance.
 */
export async function ensureUserIsLoggedIn( page ) {
	await loginToWpSite( page, true );
}

/**
 * Ensure WordPress.com user is logged in.
 * @param {page} page - Playwright page instance.
 */
export async function ensureWpComUserIsLoggedIn( page ) {
	await loginToWpCom( page, true );
}

/**
 * Ensure modules are active/inactive
 * @param {object} modules - State
 * @param {string[]} modules.active - Modules to activate.
 * @param {string[]} modules.inactive - Modules to deactivate.
 */
export async function ensureModulesState( modules ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites(
			'Site is not local, skipping modules setup. Assuming required setup is already in place.'
		);
		return;
	}

	if ( modules.active ) {
		await activateModules( modules.active );
	} else {
		logger.prerequisites( 'Cannot find list of modules to activate!' );
	}

	if ( modules.inactive ) {
		await deactivateModules( modules.inactive );
	} else {
		logger.prerequisites( 'Cannot find list of modules to deactivate!' );
	}
}

/**
 * Activate modules.
 * @param {string[]} modulesList - Modules
 */
export async function activateModules( modulesList ) {
	for ( const module of modulesList ) {
		logger.prerequisites( `Activating module ${ module }` );
		const result = await execWpCommand( `jetpack module activate ${ module }` );
		assert.match( result, new RegExp( `Success: .* has been activated.`, 'i' ) );
	}
}

/**
 * Deactivate modules.
 * @param {string[]} modulesList - Modules
 */
export async function deactivateModules( modulesList ) {
	for ( const module of modulesList ) {
		logger.prerequisites( `Deactivating module ${ module }` );
		const result = await execWpCommand( `jetpack module deactivate ${ module }` );
		assert.match( result, new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}

/**
 * Check if a module is active.
 * @param {string} module - Module
 * @returns {boolean} If active
 */
export async function isModuleActive( module ) {
	logger.prerequisites( `Checking if ${ module } module is active` );
	const result = await execWpCommand( `jetpack options get active_modules` );
	return result.includes( module );
}

/**
 * Ensure plugins are active/inactive
 * @param {object} plugins - State
 * @param {string[]} plugins.active - Plugins to activate.
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
 * @returns {boolean} If set.
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
	throw result;
}
