// From https://github.com/WordPress/gutenberg/blob/master/packages/e2e-tests/config/setup-test-framework.js

/**
 * External dependencies
 */
// import { get } from 'lodash';
// import jest, { beforeAll } from 'jest';

/**
 * WordPress dependencies
 */
import {
	/*activatePlugin, clearLocalStorage, */
	setBrowserViewport,
} from '@wordpress/e2e-test-utils';
/**
 * Internal dependencies
 */
import { registerScreenshotReporter } from '../lib/reporters/screenshot';

registerScreenshotReporter();

/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT } = process.env;

/**
 * Internal dependencies
 */
// import { init } from './jasmine-fail-fast';

// Add custom Jasmine reporter to skip tests in failing describe
// const jasmineEnv = jasmine.getEnv();
// jasmineEnv.addReporter( init() );

/**
 * Set of console logging types observed to protect against unexpected yet
 * handled (i.e. not catastrophic) errors or warnings. Each key corresponds
 * to the Puppeteer ConsoleMessage type, its value the corresponding function
 * on the console global object.
 *
 * @type {Object<string,string>}
 */
// const OBSERVED_CONSOLE_MESSAGE_TYPES = {
// 	warning: 'warn',
// 	error: 'error',
// };

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

async function setupBrowser() {
	// await clearLocalStorage();
	await setBrowserViewport( 'large' );
}

/**
 * Adds a page event handler to emit uncaught exception to process if one of
 * the observed console logging types is encountered.
 */
// function observeConsoleLogging() {
// 	page.on( 'console', message => {
// 		const type = message.type();
// 		if ( ! OBSERVED_CONSOLE_MESSAGE_TYPES.hasOwnProperty( type ) ) {
// 			return;
// 		}

// 		let text = message.text();

// 		// An exception is made for _blanket_ deprecation warnings: Those
// 		// which log regardless of whether a deprecated feature is in use.
// 		if ( text.includes( 'This is a global warning' ) ) {
// 			return;
// 		}

// 		// Viewing posts on the front end can result in this error, which
// 		// has nothing to do with Gutenberg.
// 		if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
// 			return;
// 		}

// 		const logFunction = OBSERVED_CONSOLE_MESSAGE_TYPES[ type ];

// 		// As of Puppeteer 1.6.1, `message.text()` wrongly returns an object of
// 		// type JSHandle for error logging, instead of the expected string.
// 		//
// 		// See: https://github.com/GoogleChrome/puppeteer/issues/3397
// 		//
// 		// The recommendation there to asynchronously resolve the error value
// 		// upon a console event may be prone to a race condition with the test
// 		// completion, leaving a possibility of an error not being surfaced
// 		// correctly. Instead, the logic here synchronously inspects the
// 		// internal object shape of the JSHandle to find the error text. If it
// 		// cannot be found, the default text value is used instead.
// 		text = get( message.args(), [ 0, '_remoteObject', 'description' ], text );

// 		// Disable reason: We intentionally bubble up the console message
// 		// which, unless the test explicitly anticipates the logging via
// 		// @wordpress/jest-console matchers, will cause the intended test
// 		// failure.

// 		// eslint-disable-next-line no-console
// 		console[ logFunction ]( text );
// 	} );
// }

// function enableDebug() {
// 	global.it = async function( name, func ) {
// 		return await test( name, async () => {
// 			try {
// 				await func();
// 			} catch ( e ) {
// 				console.log( e );
// 				console.log( '!!!!!  ERROR OCCURRED!' );
// 				await jestPuppeteer.debug();
// 				throw e;
// 			}
// 		} );
// 	};
// }

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	// observeConsoleLogging();

	await setupBrowser();
	// await activatePlugin( 'gutenberg-test-plugin-disables-the-css-animations' );
} );

afterEach( async () => {
	await setupBrowser();
} );
