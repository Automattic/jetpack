import logger from '../logger';
import { resetWordpressInstall } from '../utils-helper';
import { loginToWpSite } from '../flows/log-in';

export function prerequisitesBuilder() {
	const state = {
		loggedIn: undefined,
		clean: undefined,
	};

	return {
		withLoggedIn( shouldBeLoggedIn ) {
			state.loggedIn = shouldBeLoggedIn;
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

async function ensureCleanState( shouldReset ) {
	if ( shouldReset ) {
		logger.prerequisites( 'Resetting environment' );
		await resetWordpressInstall();
	}
}

export async function ensureUserIsLoggedIn() {
	await loginToWpSite( true );
}
