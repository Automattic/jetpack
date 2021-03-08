/**
 * External dependencies
 */
import fs from 'fs';
/**
 * Internal dependencies
 */
import logger from '../logger';
import { execWpCommand, getTunnelSiteUrl } from '../utils-helper';
import {
	connectThroughWPAdmin,
	loginToWpcomIfNeeded,
	loginToWpSite,
} from '../flows/jetpack-connect';
import config from 'config';
import path from 'path';

async function maybePreConnect() {
	const wpcomUser = 'defaultUser';
	const mockPlanData = true;
	const plan = 'free';

	await loginToWpcomIfNeeded( wpcomUser, mockPlanData );
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

// todo do we still need this?
// keep it for the moment and use it to log steps in console, but unless we're
// bringing back Allure or other reporter to use it we might want to remove it
export const step = async ( stepName, fn ) => {
	logger.info( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await maybePreConnect();
} );

beforeEach( async () => {
	await page.goto( getTunnelSiteUrl() + '/wp-admin' );
} );
