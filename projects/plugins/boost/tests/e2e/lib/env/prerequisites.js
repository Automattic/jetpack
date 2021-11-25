import logger from 'jetpack-e2e-commons/logger.cjs';
import { execWpCommand } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { expect } from '@playwright/test';
import { JetpackBoostPage } from '../pages/index.js';

export function boostPrerequisitesBuilder( page ) {
	const state = {
		clean: undefined,
		modules: { active: undefined, inactive: undefined },
		connected: undefined,
		jetpackDeactivated: undefined,
	};

	return {
		withActiveModules( modules = [] ) {
			state.modules.active = modules;
			return this;
		},
		withInactiveModules( modules = [] ) {
			state.modules.inactive = modules;
			return this;
		},
		withConnection( shouldBeConnected ) {
			state.connected = shouldBeConnected;
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

async function buildPrerequisites( state, page ) {
	const functions = {
		modules: () => ensureModulesState( state.modules ),
		connected: () => ensureConnectedState( state.connected, page ),
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
		const result = await execWpCommand( `jetpack-boost module activate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been activated.`, 'i' ) );
	}
}

export async function deactivateModules( modulesList ) {
	for ( const module of modulesList ) {
		logger.prerequisites( `Deactivating module ${ module }` );
		const result = await execWpCommand( `jetpack-boost module deactivate ${ module }` );
		expect( result ).toMatch( new RegExp( `Success: .* has been deactivated.`, 'i' ) );
	}
}

export async function ensureConnectedState( requiredConnected = undefined, page ) {
	const isConnected = await checkIfConnected();

	if ( requiredConnected && isConnected ) {
		logger.prerequisites( 'Jetpack Boost is already connected, moving on' );
	} else if ( requiredConnected && ! isConnected ) {
		logger.prerequisites( 'Connecting Jetpack Boost' );
		await connect( page );
	} else if ( ! requiredConnected && isConnected ) {
		logger.prerequisites( 'Disconnecting Jetpack Boost' );
		await disconnect();
	} else {
		logger.prerequisites( 'Jetpack Boost is already disconnected, moving on' );
	}
}

export async function connect( page ) {
	logger.prerequisites( `Connecting Boost plugin to WP.com` );
	// Boost cannot be connected to WP.com using the WP-CLI because the site is considered
	// as a localhost site. The only solution is to do it via the site itself running under the localtunnel.
	const jetpackBoostPage = await JetpackBoostPage.visit( page );
	await jetpackBoostPage.connect();
	await jetpackBoostPage.waitForApiResponse( 'connection' );
	await jetpackBoostPage.isOverallScoreHeaderShown();
}

export async function disconnect() {
	logger.prerequisites( `Disconnecting Boost plugin to WP.com` );
	const cliCmd = 'jetpack-boost connection deactivate';
	const result = await execWpCommand( cliCmd );
	expect( result ).toEqual( 'Success: Boost is disconnected from WP.com' );
}

export async function checkIfConnected() {
	const cliCmd = 'jetpack-boost connection status';
	const result = await execWpCommand( cliCmd );
	if ( typeof result !== 'object' ) {
		return result === 'connected';
	}
	const txt = result.toString();
	if ( txt.includes( "Error: 'jetpack-boost' is not a registered wp command" ) ) {
		return false;
	}
	throw result;
}

async function ensureCleanState( shouldReset ) {
	if ( shouldReset ) {
		logger.prerequisites( 'Resetting Jetpack Boost' );
		await execWpCommand( 'jetpack-boost reset' );
	}
}
