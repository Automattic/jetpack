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

export async function prerequisites(
	state = {
		loggedId: undefined,
		wpComLoggedIn: undefined,
		connected: undefined,
		plan: undefined, // 'free', 'complete', etc
		clean: undefined, // reset env
	}
) {
	const functions = {
		loggedIn: () => ensureUserIsLoggedIn( state.loggedId ),
		wpComLoggedIn: () => ensureWpComUserIsLoggedIn( state.loggedId ),
		connected: () => ensureConnectedState( state.connected ),
		plan: () => ensurePlan( state.plan ),
		clean: () => ensureCleanState( state.clean ),
	};

	logger.prerequisites( JSON.stringify( state, null, 2 ) );

	for ( const option of Object.keys( state ) ) {
		logger.prerequisites( `Evaluating option: ${ option }=${ state[ option ] }` );

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

export async function ensureUserIsLoggedIn( loggedIn = undefined ) {
	// if ( loggedIn ) {
	// 	logger.prerequisites( 'Ensuring user is logged in' );
	// } else {
	// 	logger.prerequisites( 'Ensuring user is logged out' );
	// }
	await loginToWpSite( true );
}

export async function ensureWpComUserIsLoggedIn( loggedIn = undefined ) {
	await loginToWpCom( 'defaultUser', true );
	// if ( loggedIn ) {
	// 	logger.prerequisites( 'Ensuring wordpress.com user is logged in' );
	// } else {
	// 	logger.prerequisites( 'Ensuring wordpress.com user is logged out' );
	// }
}
