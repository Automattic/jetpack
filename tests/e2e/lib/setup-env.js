/* eslint-disable jest/no-export */
/**
 * External dependencies
 */
import { wrap, get } from 'lodash';
import fs from 'fs';
import { setBrowserViewport, enablePageDialogAccept } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { takeScreenshot } from './reporters/screenshot';
import { logHTML, logDebugLog } from './page-helper';
import logger from './logger';
import { execWpCommand } from './utils-helper';
import { connectThroughWPAdminIfNeeded } from './flows/jetpack-connect';

const { PUPPETEER_TIMEOUT, E2E_DEBUG, CI, E2E_LOG_HTML } = process.env;
let currentBlock;

const defaultErrorHandler = async ( error, name ) => {
	// If running tests in CI
	if ( CI ) {
		const filePath = await takeScreenshot( currentBlock, name );
		reporter.addAttachment(
			`Test failed: ${ currentBlock } :: ${ name }`,
			fs.readFileSync( filePath ),
			'image/png'
		);

		logger.slack( {
			type: 'failure',
			message: { block: currentBlock, name, error },
		} );
		logger.slack( { type: 'file', message: filePath } );
		await logDebugLog();
	}

	if ( E2E_LOG_HTML ) {
		logHTML();
	}

	if ( E2E_DEBUG ) {
		console.log( error );
		await jestPuppeteer.debug();
	}

	throw error;
};

/**
 * Wrapper around `beforeAll` to be able to handle thrown exceptions within the hook.
 * Main reason is to be able to universaly capture screenshots on puppeteer exceptions.
 *
 * @param {*} callback
 * @param {*} errorHandler
 */
export const catchBeforeAll = async ( callback, errorHandler = defaultErrorHandler ) => {
	beforeAll( async () => {
		try {
			await callback();
		} catch ( error ) {
			await errorHandler( error, 'beforeAll' );
		}
	} );
};

async function setupBrowser() {
	const userAgent = await browser.userAgent();
	await page.setUserAgent( userAgent + ' wp-e2e-tests' );
	await setBrowserViewport( 'large' );
}

/**
 * Adds a page event handler to emit uncaught exception to process if one of
 * the observed console logging types is encountered.
 *
 * Taken from Gutenberg project: https://github.com/WordPress/gutenberg/blob/master/packages/e2e-tests/config/setup-test-framework.js#L127
 */
function observeConsoleLogging() {
	page.on( 'console', message => {
		const type = message.type();
		if ( ! [ 'warning', 'error' ].includes( type ) ) {
			return;
		}

		let text = message.text();

		// An exception is made for _blanket_ deprecation warnings: Those
		// which log regardless of whether a deprecated feature is in use.
		if ( text.includes( 'This is a global warning' ) ) {
			return;
		}

		// A chrome advisory warning about SameSite cookies is informational
		// about future changes, tracked separately for improvement in core.
		//
		// See: https://core.trac.wordpress.org/ticket/37000
		// See: https://www.chromestatus.com/feature/5088147346030592
		// See: https://www.chromestatus.com/feature/5633521622188032
		if ( text.includes( 'A cookie associated with a cross-site resource' ) ) {
			return;
		}

		// Viewing posts on the front end can result in this error, which
		// has nothing to do with Gutenberg.
		if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
			return;
		}

		// As of WordPress 5.3.2 in Chrome 79, navigating to the block editor
		// (Posts > Add New) will display a console warning about
		// non - unique IDs.
		// See: https://core.trac.wordpress.org/ticket/23165
		if ( text.includes( 'elements with non-unique id #_wpnonce' ) ) {
			return;
		}

		// As of Puppeteer 1.6.1, `message.text()` wrongly returns an object of
		// type JSHandle for error logging, instead of the expected string.
		//
		// See: https://github.com/GoogleChrome/puppeteer/issues/3397
		//
		// The recommendation there to asynchronously resolve the error value
		// upon a console event may be prone to a race condition with the test
		// completion, leaving a possibility of an error not being surfaced
		// correctly. Instead, the logic here synchronously inspects the
		// internal object shape of the JSHandle to find the error text. If it
		// cannot be found, the default text value is used instead.
		text = get( message.args(), [ 0, '_remoteObject', 'description' ], text );

		// Disable reason: We intentionally bubble up the console message
		// which, unless the test explicitly anticipates the logging via
		// @wordpress/jest-console matchers, will cause the intended test
		// failure.

		logger.info( `${ type.toUpperCase() }:` + text );
	} );
}

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 300000 );
if ( E2E_DEBUG ) {
	jest.setTimeout( 2147483647 ); // max 32-bit signed integer
}

// Use wrap to preserve all previous `wrap`s
jasmine.getEnv().describe = wrap( jasmine.getEnv().describe, ( func, ...args ) => {
	try {
		currentBlock = args[ 0 ];
		func( ...args );
	} catch ( e ) {
		throw e;
	}
} );

/**
 * Override the test case method so we can take screenshots of assertion failures.
 *
 * See: https://github.com/smooth-code/jest-puppeteer/issues/131#issuecomment-469439666
 *
 * @param {string} name
 * @param {Function} func
 */
global.it = async ( name, func ) => {
	return await test( name, async () => {
		try {
			await func();
		} catch ( error ) {
			await defaultErrorHandler( error, name );
		}
	} );
};

export const step = async ( stepName, fn ) => {
	reporter.startStep( stepName );
	await fn();
	reporter.endStep();
};

jasmine.getEnv().addReporter( {
	specStarted( result ) {
		logger.info( `Spec name: ${ result.fullName }, description: ${ result.description }` );
		jasmine.currentTest = result;
	},
	specDone: () => ( jasmine.currentTest = null ),
} );

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
catchBeforeAll( async () => {
	await setupBrowser();

	// Handles not saved changed dialog in block editor
	await enablePageDialogAccept();
	observeConsoleLogging();

	const status = await connectThroughWPAdminIfNeeded( {
		mockPlanData: true,
		plan: 'free',
	} );

	if ( status !== 'already_connected' ) {
		const result = await execWpCommand( 'wp option get jetpack_private_options --format=json' );
		fs.writeFileSync( 'jetpack_private_options.txt', result.trim() );
	}
} );

afterEach( async () => {
	await setupBrowser();
} );
