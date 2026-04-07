import fs from 'fs';
import config from 'config';
import logger from '../logger';
import { executeCommand } from './cli';

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

const { TEST_SITE } = process.env;

/**
 * Get test site config.
 *
 * @return {TestSite} Site config
 */
export function getConfigTestSite(): TestSite {
	const testSite = TEST_SITE ? TEST_SITE : 'default';
	logger.debug( `Using '${ testSite }' test site config` );
	return config.get< TestSite >( `testSites.${ testSite }` );
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
	let url: string | undefined;

	if ( TEST_SITE ) {
		const siteConfig = config.get< { get?: ( key: string ) => string; url?: string } >(
			`testSites.${ TEST_SITE }`
		);
		url = typeof siteConfig.get === 'function' ? siteConfig.get( 'url' ) : siteConfig.url;
	} else if ( process.env.USE_CLOUDFLARE_TUNNEL ) {
		logger.debug( 'USE_CLOUDFLARE_TUNNEL is set, checking cloudflared tunnel file' );

		const cloudflaredPath = config.get( 'dirs.temp' ) + '/cloudflared-url';
		try {
			url = fs.readFileSync( cloudflaredPath, 'utf8' ).replace( 'http:', 'https:' );
			logger.debug( `Using cloudflared tunnel URL from file: ${ url }` );
		} catch ( error: unknown ) {
			if ( error instanceof Error && ( error as NodeJS.ErrnoException ).code === 'ENOENT' ) {
				logger.warn( 'USE_CLOUDFLARE_TUNNEL is set but cloudflared tunnel file not found' );
			} else {
				logger.error( error );
			}
		}
	} else {
		logger.debug( 'Checking for localtunnel url' );

		// Check localtunnel file first
		const localtunnelPath = config.get( 'dirs.temp' ) + '/localtunnel-url';
		try {
			url = fs.readFileSync( localtunnelPath, 'utf8' ).replace( 'http:', 'https:' );
			logger.debug( `Using localtunnel URL from file: ${ url }` );
		} catch ( error: unknown ) {
			if ( error instanceof Error && ( error as NodeJS.ErrnoException ).code === 'ENOENT' ) {
				logger.warn( 'Localtunnel file not found' );
			} else {
				logger.error( error );
			}
		}
	}

	if ( ! url ) {
		throw new Error( 'Site URL could not be resolved. Please check your configuration.' );
	}

	// Validate the URL. This will throw if the URL is invalid.
	const validatedURL = new URL( url );
	logger.debug( `Using site url: ${ validatedURL }` );
	return validatedURL.toString().replace( /\/$/, '' ); // Remove trailing slash if present
}

/**
 * Checks if the test site is a local one, with wp-cli accessible or a remote one
 *
 * @return {boolean} true if site is local
 */
export function isLocalSite(): boolean {
	return ! TEST_SITE;
}

/**
 * Resets the environment.
 */
export async function resetEnvironment() {
	logger.info( 'Resetting environment' );
	await executeCommand( 'jetpack disconnect blog' );
	await executeCommand( 'pnpm e2e-env reset' );
}
