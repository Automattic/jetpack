/**
 * External dependencies
 */
import fs from 'fs';
/**
 * Internal dependencies
 */
import logger from '../logger';
import { execWpCommand } from '../utils-helper';
import {
	connectThroughWPAdmin,
	loginToWpComIfNeeded,
	loginToWpSite,
} from '../flows/jetpack-connect';
import config from 'config';
import path from 'path';

async function maybePreConnect() {
	const wpComUser = 'defaultUser';
	const mockPlanData = true;
	const plan = 'free';

	await loginToWpComIfNeeded( wpComUser, mockPlanData );
	await loginToWpSite( mockPlanData );

	if ( process.env.SKIP_CONNECT ) {
		return;
	}

	const status = await connectThroughWPAdmin( { mockPlanData, plan } );

	if ( status !== 'already_connected' ) {
		const result = await execWpCommand( 'wp option get jetpack_private_options --format=json' );
		fs.writeFileSync(
			path.resolve( config.get( 'configDir' ), 'jetpack-private-options.txt' ),
			result.trim()
		);
	}
}

export const step = async ( stepName, fn ) => {
	logger.step( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await maybePreConnect();
} );
