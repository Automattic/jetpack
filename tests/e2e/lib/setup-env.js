/**
 * WordPress dependencies
 */
import { setBrowserViewport } from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */
import { registerSlackReporter, registerScreenshotReporter } from '../reporters/slack';
/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

registerSlackReporter();

async function setupBrowser() {
	await setBrowserViewport( 'large' );
}

function enableDebug() {
	jest.setTimeout( 2147483647 ); // max 32-bit signed integer

	global.it = async function( name, func ) {
		await test( name, async () => {
			try {
				await func();
			} catch ( e ) {
				console.log( e );
				console.log( '!!!!!  ERROR OCCURRED!' );
				await jestPuppeteer.debug();
				// throw e;
			}
		} );
	};
}

enableDebug();
registerScreenshotReporter();

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	await setupBrowser();
} );

afterEach( async () => {
	await setupBrowser();
} );
