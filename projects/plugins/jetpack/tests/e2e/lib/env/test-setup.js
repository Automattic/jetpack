import fs from 'fs';
import logger from '../logger';
import {
	execWpCommand,
	getAccountCredentials,
	provisionJetpackStartConnection,
} from '../utils-helper';
import { loginToWpComIfNeeded, loginToWpSite, isBlogTokenSet } from '../flows/jetpack-connect';
import config from 'config';

async function maybePreConnect() {
	const wpComUser = 'defaultUser';
	const mockPlanData = true;
	const plan = 'free';

	await loginToWpComIfNeeded( wpComUser, mockPlanData );
	await loginToWpSite( mockPlanData );

	if ( process.env.SKIP_CONNECT ) {
		return;
	}

	if ( ! ( await isBlogTokenSet() ) ) {
		const userId = getAccountCredentials( 'defaultUser' )[ 2 ];
		return await provisionJetpackStartConnection( userId, plan );
	}

	// We are connected. Let's save the existing connection options just in case.
	const result = await execWpCommand( 'wp option get jetpack_private_options --format=json' );
	fs.writeFileSync( config.get( 'temp.jetpackPrivateOptions' ), result.trim() );
}

export const step = async ( stepName, fn ) => {
	logger.step( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await maybePreConnect();
} );
