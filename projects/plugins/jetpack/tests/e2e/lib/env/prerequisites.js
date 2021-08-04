import logger from '../logger';
import { isBlogTokenSet, syncJetpackPlanData } from '../flows/jetpack-connect';
import {
	execMultipleWpCommands,
	execWpCommand,
	getAccountCredentials,
	provisionJetpackStartConnection,
	resetWordpressInstall,
} from '../utils-helper';
import fs from 'fs';
import config from 'config';
import { loginToWpCom, loginToWpSite } from '../flows/log-in';

export function prerequisitesBuilder() {
	const state = {
		loggedIn: undefined,
		wpComLoggedIn: undefined,
		connected: undefined,
		plan: undefined, // 'free', 'complete', etc
		modules: { active: undefined, inactive: undefined },
		clean: undefined, // reset env
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
		withCleanEnv( shouldCleanEnv ) {
			state.clean = shouldCleanEnv;
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
	const userId = getAccountCredentials( 'defaultUser' )[ 2 ];
	await provisionJetpackStartConnection( userId, 'free' );

	expect( await isBlogTokenSet() ).toBeTruthy();

	// We are connected. Let's save the existing connection options just in case.
	const result = await execWpCommand( 'wp option get jetpack_private_options --format=json' );
	fs.writeFileSync( config.get( 'temp.jetpackPrivateOptions' ), result.trim() );
}

async function disconnect() {
	// await resetWordpressInstall();
	await execMultipleWpCommands(
		'wp option delete jetpack_private_options',
		'wp option delete jetpack_sync_error_idc'
	);
	expect( await isBlogTokenSet() ).toBeFalsy();
}

async function ensureCleanState( shouldReset ) {
	if ( shouldReset ) {
		logger.prerequisites( 'Resetting environment' );
		await resetWordpressInstall();
	}
}

export async function ensurePlan( plan = undefined ) {
	if ( [ 'free', 'complete' ].indexOf( plan ) < 0 ) {
		throw new Error( `Unsupported plan ${ plan }` );
	}

	await syncJetpackPlanData( plan, true );
}

export async function ensureUserIsLoggedIn() {
	await loginToWpSite( true );
}

export async function ensureWpComUserIsLoggedIn() {
	await loginToWpCom( 'defaultUser', true );
}

export async function ensureModulesState( modules ) {
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
		const result = await execWpCommand( `wp jetpack module activate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been activated.`, 'i' ) );
	}
}

export async function deactivateModules( modulesList ) {
	for ( const module of modulesList ) {
		logger.prerequisites( `Deactivating module ${ module }` );
		const result = await execWpCommand( `wp jetpack module deactivate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}
