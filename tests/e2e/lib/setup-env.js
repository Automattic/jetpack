/**
 * External dependencies
 */
import { wrap } from 'lodash';
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

		logger.slack( { type: 'failure', message: { block: currentBlock, name, error } } );
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

function setupConsoleLogs() {
	page.on( 'pageerror', function( err ) {
		const theTempValue = err.toString();
		logger.info( 'Page error: ' + theTempValue );
	} );
	page.on( 'error', function( err ) {
		const theTempValue = err.toString();
		logger.info( 'Error: ' + theTempValue );
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
	setupConsoleLogs();

	const status = await connectThroughWPAdminIfNeeded( { mockPlanData: true, plan: 'free' } );

	if ( status !== 'already_connected' ) {
		const result = await execWpCommand( 'wp option get jetpack_private_options --format=json' );
		fs.writeFileSync( 'jetpack_private_options.txt', result.trim() );
	}
} );

afterEach( async () => {
	await setupBrowser();
} );
