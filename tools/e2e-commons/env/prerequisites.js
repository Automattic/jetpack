import logger from '../logger';
import { syncJetpackPlanData, loginToWpCom, loginToWpSite } from '../flows';
import {
	execWpCommand,
	getDotComCredentials,
	isLocalSite,
	provisionJetpackStartConnection,
	resetWordpressInstall,
} from '../helpers/utils-helper';
import fs from 'fs';
import config from 'config';
import assert from 'assert';

export function prerequisitesBuilder() {
	const state = {
		clean: undefined,
		loggedIn: undefined,
		wpComLoggedIn: undefined,
		connected: undefined,
		plan: undefined,
		modules: { active: undefined, inactive: undefined },
	};

	return {
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
			await buildPrerequisites( state );
		},
	};
}

async function buildPrerequisites( state ) {
	const functions = {
		loggedIn: () => ensureUserIsLoggedIn( state.loggedIn ),
		wpComLoggedIn: () => ensureWpComUserIsLoggedIn( state.wpComLoggedIn ),
		connected: () => ensureConnectedState( state.connected ),
		plan: () => ensurePlan( state.plan ),
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

export async function ensureConnectedState( requiredConnected = undefined ) {
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

async function connect() {
	const creds = getDotComCredentials();
	await execWpCommand( `user update wordpress --user_email=${ creds.email }` );

	await provisionJetpackStartConnection( creds.userId, 'free' );

	assert.ok( await isBlogTokenSet() );

	// We are connected. Let's save the existing connection options just in case.
	const result = await execWpCommand( 'option get jetpack_private_options --format=json' );
	fs.writeFileSync( config.get( 'temp.jetpackPrivateOptions' ), result.trim() );
}

async function disconnect() {
	await execWpCommand( 'option delete jetpack_private_options' );
	await execWpCommand( 'option delete jetpack_sync_error_idc' );

	assert.ok( ! ( await isBlogTokenSet() ) );
}

async function ensureCleanState( shouldReset ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites( 'Site is not local, skipping environment reset.' );
		return;
	}

	if ( shouldReset ) {
		logger.prerequisites( 'Resetting environment' );
		await resetWordpressInstall();
	}
}

export async function ensurePlan( plan = undefined ) {
	if ( ! isLocalSite() ) {
		logger.prerequisites(
			'Site is not local, skipping plan setup. Assuming required plan is already in place.'
		);
		return;
	}

	if ( [ 'free', 'complete' ].indexOf( plan ) < 0 ) {
		throw new Error( `Unsupported plan ${ plan }` );
	}

	await syncJetpackPlanData( plan, true );
}

export async function ensureUserIsLoggedIn() {
	await loginToWpSite( true );
}

export async function ensureWpComUserIsLoggedIn() {
	await loginToWpCom( true );
}

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

export async function activateModules( modulesList ) {
	for ( const module of modulesList ) {
		logger.prerequisites( `Activating module ${ module }` );
		const result = await execWpCommand( `jetpack module activate ${ module }` );
		assert.match( result, new RegExp( `Success: .* has been activated.`, 'i' ) );
	}
}

export async function deactivateModules( modulesList ) {
	for ( const module of modulesList ) {
		logger.prerequisites( `Deactivating module ${ module }` );
		const result = await execWpCommand( `jetpack module deactivate ${ module }` );
		assert.match( result, new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}

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
