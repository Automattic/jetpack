import fs from 'fs';
import path from 'path';
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
 * Reads and returns the content of the file expected to store an URL.
 * The file path is stored in config.
 * No validation is done on the file content, so an invalid URL can be returned.
 *
 * @return {string} the file content, or undefined in file doesn't exist or cannot be read
 */
export function getReusableUrlFromFile(): string {
	let urlFromFile;
	try {
		urlFromFile = fs
			.readFileSync( config.get( 'temp.tunnels' ), 'utf8' )
			.replace( 'http:', 'https:' );
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			// We expect this, reduce noise in logs
			logger.warn( "Tunnels file doesn't exist" );
		} else {
			logger.error( error );
		}
	}
	return urlFromFile;
}

/**
 * There are two ways to set the target site url:
 * 1. Write it in 'temp.tunnels' file
 * 2. Configure a test site in local config and use a TEST_SITE env variable with the config property name. This overrides any value written in file
 * If none of the above is valid we throw an error
 *
 * @return {string} URL.
 */
export function resolveSiteUrl() {
	let url;

	if ( process.env.TEST_SITE ) {
		url = config.get( `testSites.${ process.env.TEST_SITE }` ).get( 'url' );
	} else {
		logger.debug( 'Checking for existing tunnel url' );
		url = getReusableUrlFromFile();
	}

	validateUrl( url );
	logger.debug( `Using site ${ url }` );
	return url;
}

/**
 * Throw an error if the passed parameter is not a valid URL
 *
 * @param {string} url - the string to to be validated as URL
 */
export function validateUrl( url ) {
	const obj = new URL( url );
	if ( ! obj ) {
		throw new Error( `Undefined or invalid url!` );
	}
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
