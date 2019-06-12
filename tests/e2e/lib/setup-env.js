/**
 * WordPress dependencies
 */
import { setBrowserViewport } from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */
import { registerSlackReporter } from './reporters/slack';
import { registerScreenshotReporter } from './reporters/screenshot';
/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 300000 );

async function setupBrowser() {
	await setBrowserViewport( 'large' );
}

function enableDebug() {
	if ( ! process.env.E2E_DEBUG ) {
		return;
	}
	jest.setTimeout( 2147483647 ); // max 32-bit signed integer

	global.it = async function( name, func ) {
		await test( name, async () => {
			try {
				await func();
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.log( e );
				await jestPuppeteer.debug();
				// throw e;
			}
		} );
	};
}
enableDebug();

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	registerScreenshotReporter();
	registerSlackReporter();
	await setupBrowser();
} );

afterEach( async () => {
	await setupBrowser();
} );
