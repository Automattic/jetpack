import fsp from 'fs/promises';
import pathLib from 'path';
import { expect } from '@jest/globals';
import axios, { Method } from 'axios';
import { deleteContainerDirectory } from './docker-tools';
import { wpcli } from './wordpress-tools';

/**
 * Returns the absolute path of a file in the plugin directory.
 *
 * @param {string} path - The path to the file, relative to the plugin directory.
 * @return {string} The absolute path to the file.
 */
export function pluginFilePath( path: string ) {
	return pathLib.join( __dirname, '../../../', path );
}

/**
 * Returns the contents of the specified file from the plugin directory.
 *
 * @param {string} path - The path to the file, relative to the plugin directory.
 * @return {string} The contents of the file. Assumed to be utf8.
 */
export async function readPluginFile( path: string ): Promise< string > {
	return fsp.readFile( pluginFilePath( path ), 'utf8' );
}

/**
 * Clears the cache.
 */
export async function clearCache(): Promise< void > {
	await wpcli( 'eval', 'wp_cache_clear_cache();' );
}

/**
 * Logs into the site and creates an auth cookie that can be used for authenticated requests.
 *
 * @return {string} The auth cookie.
 */
export async function getAuthCookie(): Promise< string > {
	const user = process.env.SUPER_CACHE_E2E_ADMIN_USER;
	const pass = process.env.SUPER_CACHE_E2E_ADMIN_PASSWORD;
	const encodedAuth = Buffer.from( user + ':' + pass ).toString( 'base64' );
	const headers = { Authorization: 'test ' + encodedAuth };

	const response = await axios.post( getSiteUrl(), {}, { headers } );
	expect( response.status ).toBe( 200 );

	const cookies = response.headers[ 'set-cookie' ];

	return cookies.map( c => c.replace( ' HttpOnly', '' ) ).join( '; ' );
}

/**
 * Makes an authenticated request to the specified URL.
 *
 * @param {string} authCookie - Authentication cookie to use for the request.
 * @param {Method} method     - HTTP method to use. e.g.: 'GET'.
 * @param {string} url        - URL to request.
 * @param {Object} data       - Key / value pairs (strings) to submit as post data.
 */
export async function authenticatedRequest(
	authCookie: string,
	method: Method,
	url: string,
	data: Record< string, string > = undefined
): Promise< string > {
	const response = await axios( url, {
		method,
		data: data ? new URLSearchParams( data ).toString() : null,
		headers: {
			Cookie: authCookie,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	} );

	expect( response.status ).toBe( 200 );

	return response.data;
}

/**
 * Returns a URL within the plugin site.
 *
 * @param {string} path  - The path relative to the site URL.
 * @param {Object} query - Query parameters to add to the URL.
 * @return {string} The site URL.
 */
export function getSiteUrl( path = '/', query: Record< string, string > = {} ): string {
	const domain = 'http://localhost:' + process.env.SUPER_CACHE_E2E_PORT;
	const queryString = new URLSearchParams( query ).toString();

	return domain + path + ( queryString ? '?' + queryString : '' );
}

/**
 * Delete the cache directory.
 */
export async function deleteCacheDirectory(): Promise< void > {
	return deleteContainerDirectory( '/var/www/html/wp-content/cache' );
}
