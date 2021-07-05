import logger from '../logger';

export async function prerequisites(
	options = {
		loggedId: undefined,
		wpComLoggedIn: undefined,
		connected: undefined,
		plan: undefined, // 'free', 'complete', etc
		clean: undefined, // ?
	}
) {
	await ensureConnectedState( options.connected );
	await ensurePlan( options.plan );
	await ensureUserIsLoggedIn( options.loggedId );
	await ensureWpComUserIsLoggedIn( options.loggedId );
}

export async function ensureConnectedState( connected = undefined ) {
	logger.prerequisites( JSON.stringify( connected ) );

	if ( connected === undefined ) {
		logger.prerequisites( 'Leaving connection as it is' );
		return;
	}

	if ( connected ) {
		logger.prerequisites( 'Ensuring site is connected' );
	} else {
		logger.prerequisites( 'Ensuring site is not connected' );
	}
}

export async function ensurePlan( plan = undefined ) {
	logger.prerequisites( JSON.stringify( plan ) );

	if ( plan === undefined ) {
		logger.prerequisites( 'Leaving plan as it is' );
		return;
	}

	if ( [ 'free', 'complete' ].indexOf( plan ) < 0 ) {
		throw new Error( `Unsupported plan ${ plan }` );
	}
}

export async function ensureUserIsLoggedIn( loggedIn = undefined ) {
	logger.prerequisites( JSON.stringify( loggedIn ) );

	if ( loggedIn === undefined ) {
		logger.prerequisites( 'Ignoring logged in state' );
		return;
	}

	if ( loggedIn ) {
		logger.prerequisites( 'Ensuring user is logged in' );
	} else {
		logger.prerequisites( 'Ensuring user is logged out' );
	}
}

export async function ensureWpComUserIsLoggedIn( loggedIn = undefined ) {
	logger.prerequisites( JSON.stringify( loggedIn ) );

	if ( loggedIn === undefined ) {
		logger.prerequisites( 'Ignoring wordpress.com user logged in state' );
		return;
	}

	if ( loggedIn ) {
		logger.prerequisites( 'Ensuring wordpress.com user is logged in' );
	} else {
		logger.prerequisites( 'Ensuring wordpress.com user is logged out' );
	}
}
