/* eslint-disable playwright/no-standalone-expect */
import dns from 'dns/promises';
import { test as setup, expect } from '../fixtures/base-test';
import logger from '../logger';

setup( 'verify environment readiness', async ( { baseURL, request, testUtils } ) => {
	// Skip connectivity checks for localhost URLs
	if ( baseURL.includes( 'localhost' ) || baseURL.includes( '127.0.0.1' ) ) {
		await setup.step( 'skip - localhost environment', async () => {
			logger.debug( 'Localhost environment detected, skipping connectivity checks' );
		} );
		return;
	}

	await setup.step( 'verify DNS resolution', async () => {
		logger.debug( `Checking DNS resolution for ${ baseURL }` );
		const hostname = new URL( baseURL ).hostname;

		await expect( async () => {
			await dns.resolve4( hostname );
			logger.debug( `DNS resolved` );
		} ).toPass( {
			intervals: [ 1000 ],
			timeout: 30000, // 30 seconds total
		} );
	} );

	await setup.step( 'verify HTTP connectivity', async () => {
		logger.debug( `Checking HTTP connectivity for ${ baseURL }` );
		await expect( async () => {
			const response = await request.get( baseURL, { timeout: 5000 } );
			logger.debug( `HTTP response status: ${ response.status() }` );
			// Accept any HTTP response as success (including redirects, 404s, etc)
			// We just need to know the site is reachable
		} ).toPass( {
			intervals: [ 1000 ],
			timeout: 30000, // 30 seconds total
		} );
	} );

	await setup.step( 'verify REST API', async ( {} ) => {
		logger.debug( `Checking REST API for ${ baseURL }` );
		await expect( async () => {
			const r = await testUtils.requestUtils.rest( { path: 'jetpack/v4/connection/test' } );
			logger.debug( `Response: ${ JSON.stringify( r ) }` );
		} ).toPass( {
			intervals: [ 1000 ],
			timeout: 30000, // 30 seconds total
		} );
	} );
} );
