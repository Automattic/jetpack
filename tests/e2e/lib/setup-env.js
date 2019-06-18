/**
 * WordPress dependencies
 */
import { setBrowserViewport } from '@wordpress/e2e-test-utils';
/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT, E2E_DEBUG } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 300000 );
if ( E2E_DEBUG ) {
	jest.setTimeout( 2147483647 ); // max 32-bit signed integer
}

async function setupBrowser() {
	const userAgent = await browser.userAgent();
	await page.setUserAgent( userAgent + ' wp-e2e-tests' );
	await setBrowserViewport( 'large' );
}

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	await setupBrowser();
} );

afterEach( async () => {
	await setupBrowser();
} );
