/* eslint-disable jest/no-export */
/**
 * External dependencies
 */
import { get, wrap } from 'lodash';
import fs from 'fs';
/**
 * Internal dependencies
 */
import { takeScreenshot } from './reporters/screenshot';
import { logDebugLog, logHTML } from './page-helper';
import logger from './logger';
import { execWpCommand } from './utils-helper';
import {
	connectThroughWPAdmin,
	loginToWpcomIfNeeded,
	loginToWpSite,
} from './flows/jetpack-connect';
import TunnelManager from './tunnel-manager';
import config from 'config';
import path from 'path';

const { E2E_TIMEOUT, E2E_DEBUG, CI, E2E_LOG_HTML } = process.env;
let currentBlock;

const defaultErrorHandler = async ( error, name ) => {
	let filePath;

	try {
		filePath = await takeScreenshot( currentBlock, name );
		reporter.addAttachment(
			`Test failed: ${ currentBlock } :: ${ name }`,
			fs.readFileSync( filePath ),
			'image/png'
		);
	} catch ( e ) {
		logger.warn( `Failed to add attachment to allure report: ${ e }` );
	}

	// If running tests in CI
	if ( CI ) {
		await logDebugLog();
		logger.slack( {
			type: 'failure',
			message: { block: currentBlock, name, error },
		} );
		if ( filePath ) {
			logger.slack( { type: 'file', message: filePath } );
		}
	}

	if ( E2E_LOG_HTML ) {
		logHTML();
	}

	if ( E2E_DEBUG ) {
		console.log( error );
		await jestPlaywright.debug();
	}

	throw error;
};

/**
 * Wrapper around `beforeAll` to be able to handle thrown exceptions within the hook.
 * Main reason is to be able to universally capture screenshots on exceptions.
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

async function setUserAgent() {
	let userAgent = await page.evaluate( () => navigator.userAgent );
	const userAgentSuffix = 'wp-e2e-tests';
	const e2eUserAgent = `${ userAgent } ${ userAgentSuffix }`;

	const storageFilePath = 'config/storage.json';
	if ( ! fs.existsSync( storageFilePath ) ) {
		fs.writeFileSync( storageFilePath, '{}' );
	}

	// Reset context as a workaround to set a custom user agent
	await jestPlaywright.resetContext( {
		userAgent: e2eUserAgent,
		storageState: storageFilePath,
	} );

	userAgent = await page.evaluate( () => navigator.userAgent );
	logger.info( `User agent updated to: ${ userAgent }` );
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

		//todo confirm this is valid for Playwright, remove if otherwise
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

		logger.info( `CONSOLE: ${ type.toUpperCase() }: ${ text }` );
	} );
}

async function maybePreConnect() {
	const wpcomUser = 'defaultUser';
	const mockPlanData = true;
	const plan = 'free';

	await loginToWpcomIfNeeded( wpcomUser, mockPlanData );
	await loginToWpSite( mockPlanData );

	if ( process.env.SKIP_CONNECT ) {
		return;
	}

	const status = await connectThroughWPAdmin( { mockPlanData, plan } );

	if ( status !== 'already_connected' ) {
		const result = await execWpCommand( 'wp option get jetpack_private_options --format=json' );
		fs.writeFileSync(
			path.resolve( config.get( 'configDir' ), 'jetpack-private-options.txt' ),
			result.trim()
		);
	}
}

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( E2E_TIMEOUT || 300000 );
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
 * @param {string} name
 * @param {Function} func
 */
global.it = async ( name, func ) => {
	return await test( `${ name }`, async () => {
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
	jasmineStarted() {
		logger.info( '############# \n\n\n' );
	},
	suiteStarted( result ) {
		logger.info( `STARTING SUITE: ${ result.fullName }, description: ${ result.description }` );
	},
	suiteDone( result ) {
		logger.info( `SUITE ENDED: ${ result.status }\n` );
	},
	specStarted( result ) {
		logger.info( `STARTING SPEC: ${ result.fullName }, description: ${ result.description }` );
		jasmine.currentTest = result;
	},
	specDone( result ) {
		logger.info( `SPEC ENDED: ${ result.status }\n` );
		jasmine.currentTest = null;
	},
} );

const tunnelManager = new TunnelManager();

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
catchBeforeAll( async () => {
	await setUserAgent();

	// Handles not saved changed dialog in block editor
	observeConsoleLogging();

	page.on( 'dialog', async dialog => {
		await dialog.accept();
	} );

	const url = await tunnelManager.create( process.env.SKIP_CONNECT );
	global.tunnelUrl = url;
	await maybePreConnect();
} );

afterAll( async () => {
	await tunnelManager.close();
} );
