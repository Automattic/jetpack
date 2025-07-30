import fs from 'fs';
import config from 'config';
import logger from '../logger.js';
import { executeCommand } from './cli.js';

interface TestSite {
	url: string;
	username: string;
	password: string;
	dotComAccount: string[];
}

interface Credentials {
	username: string;
	password: string;
	userId?: string;
	email?: string;
	bearerToken?: string;
	apiPassword?: string;
}

/**
 * Get test site config.
 *
 * @return {TestSite} Site config
 */
export function getConfigTestSite(): TestSite {
	const testSite = process.env.TEST_SITE ? process.env.TEST_SITE : 'default';
	logger.debug( `Using '${ testSite }' test site config` );
	return config.get( `testSites.${ testSite }` );
}

/**
 * Get site credentials.
 *
 * @return {object} Credentials.
 */
export function getSiteCredentials(): Credentials {
	const site = getConfigTestSite();
	return { username: site.username, password: site.password };
}

/**
 * Get DotCom credentials.
 *
 * @return {Credentials} Credentials.
 */
export function getDotComCredentials(): Credentials {
	const site = getConfigTestSite();
	return {
		username: site.dotComAccount[ 0 ],
		password: site.dotComAccount[ 1 ],
		userId: site.dotComAccount[ 2 ],
		email: site.dotComAccount[ 3 ],
	};
}

/**
 * There are two ways to set the target site url:
 * 1. Write it in 'temp.tunnels' file
 * 2. Configure a test site in local config and use a TEST_SITE env variable with the config property name. This overrides any value written in file
 * If none of the above is valid we throw an error
 *
 * @return {string} URL.
 */
export function resolveSiteUrl(): string {
	let url;

	if ( process.env.TEST_SITE ) {
		url = config.get( `testSites.${ process.env.TEST_SITE }` ).get( 'url' );
	} else {
		logger.debug( 'Checking for existing tunnel url' );
		const filePath = config.get( 'temp.tunnels' );
		try {
			url = fs.readFileSync( filePath, 'utf8' ).replace( 'http:', 'https:' );
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) {
				logger.warn( `"${ filePath }" file doesn't exist` );
			} else {
				logger.error( error );
			}
		}
	}

	// Validate the URL
	url = new URL( url );
	logger.debug( `Using site url: ${ url }` );
	return url.toString();
}

/**
 * Checks if the test site is a local one, with wp-cli accessible or a remote one
 *
 * @return {boolean} true if site is local
 */
export function isLocalSite() {
	return ! process.env.TEST_SITE;
}

/**
 * Resets the environment.
 */
export async function resetEnvironment() {
	logger.info( 'Resetting environment' );
	await executeCommand( 'jetpack disconnect blog' );
	await executeCommand( 'pnpm e2e-env reset' );
}
