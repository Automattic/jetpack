import dns from 'dns/promises';
import { test as setup, expect } from '../fixtures/base-test';
import logger from '../logger';
import { getCIProjectNameTestTag } from '../utils/formatting';

/**
 * Helper function to run an expectation with polling measurement
 * @param name    - Name of the check for logging
 * @param checkFn - The async function to poll
 * @param options - Polling options (intervals and timeout)
 */
async function retry(
	name: string,
	checkFn: () => Promise< void >,
	options = { intervals: [ 1000 ], timeout: 30000 }
) {
	let pollCount = 0;
	const startTime = Date.now();

	await expect( async () => {
		pollCount++;
		await checkFn();
	} ).toPass( options );

	const duration = Date.now() - startTime;
	const successMsg = `${ name } succeeded after ${ pollCount } attempts in ${ duration }ms`;
	logger.debug( successMsg );

	// Add a test step with the success message - only for reporting
	await setup.step( successMsg, async () => {} );
}

setup(
	'verify environment readiness',
	{ tag: [ getCIProjectNameTestTag() ] },
	async ( { baseURL, request } ) => {
		// eslint-disable-next-line playwright/no-conditional-in-test
		if ( ! baseURL ) {
			throw new Error( 'baseURL is not configured' );
		}

		// Skip connectivity checks for localhost URLs
		// eslint-disable-next-line playwright/no-conditional-in-test
		if ( baseURL.includes( 'localhost' ) || baseURL.includes( '127.0.0.1' ) ) {
			await setup.step( 'skip - localhost environment', async () => {
				logger.debug( 'Localhost environment detected, skipping connectivity checks' );
			} );

			return;
		}

		await setup.step( 'verify DNS resolution', async () => {
			logger.debug( `Checking DNS resolution for ${ baseURL }` );
			const hostname = new URL( baseURL ).hostname;

			await retry( 'DNS resolution', async () => {
				await dns.resolve4( hostname );
			} );
		} );

		await setup.step( 'verify HTTP connectivity', async () => {
			logger.debug( `Checking HTTP connectivity for ${ baseURL }` );

			await retry( 'HTTP connectivity', async () => {
				const response = await request.get( baseURL );
				expect( response.status(), `Unexpected HTTP status` ).toBe( 200 );
			} );
		} );
	}
);
