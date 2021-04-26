import logger from '../logger';

export async function prerequisites(
	options = {
		connected: undefined,
		plan: undefined, // 'free', 'complete', etc
		gutenberg: undefined,
		loggedId: undefined,
		wpComLoggedIn: undefined,
		clean: undefined,
	}
) {
	await ensureConnectedState( options.connected );
	await ensurePlan( options.plan );
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
