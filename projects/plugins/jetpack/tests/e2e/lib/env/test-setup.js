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

/**
 * Extracts a `accountName` configuration from the config file.
 *
 * @param {string} accountName one of the keys of `testAccounts` entry in config file
 *
 * @return {Array} username and password
 */
export function getAccountCredentials( accountName ) {
	const globalConfig = config.get( 'testAccounts' );
	if ( globalConfig.has( 'testAccounts' ) ) {
		throw new Error( `${ accountName } not found in config file` );
	}

	return globalConfig.get( accountName );
}

export const step = async ( stepName, fn ) => {
	logger.step( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await maybePreConnect();
} );

beforeEach( async () => {
	await page.goto( getTunnelSiteUrl() + '/wp-admin' );
} );
