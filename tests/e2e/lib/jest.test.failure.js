/**
 * External dependencies
 */
import { wrap } from 'lodash';
/**
 * Internal dependencies
 */
import { sendFailedTestScreenshotToSlack, sendFailedTestMessageToSlack } from './reporters/slack';
import { takeScreenshot } from './reporters/screenshot';
import { logHTML, logDebugLog } from './page-helper';

/**
 * Override the test case method so we can take screenshots of assertion failures.
 *
 * See: https://github.com/smooth-code/jest-puppeteer/issues/131#issuecomment-469439666
 */
let currentBlock;
const { CI, E2E_DEBUG, E2E_LOG_HTML } = process.env;

export const defaultErrorHandler = async ( error, name ) => {
	// If running tests in CI
	if ( CI ) {
		const filePath = await takeScreenshot( currentBlock, name );
		await sendFailedTestMessageToSlack( { block: currentBlock, name, error } );
		await sendFailedTestScreenshotToSlack( filePath );
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

// Wrapper around `beforeAll` to be able to handle thrown exceptions within the hook.
// Main reason is to be able to universaly capture screenshots on puppeteer exceptions.
export const catchBeforeAll = async ( callback, errorHandler = defaultErrorHandler ) => {
	beforeAll( async () => {
		try {
			await callback();
		} catch ( error ) {
			await errorHandler( error, 'beforeAll' );
		}
	} );
};

// Use wrap to preserve all previous `wrap`s
jasmine.getEnv().describe = wrap( jasmine.getEnv().describe, ( func, ...args ) => {
	try {
		currentBlock = args[ 0 ];
		func( ...args );
	} catch ( e ) {
		throw e;
	}
} );

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
		console.log( `Spec name: ${ result.fullName }, description: ${ result.description }` );
	},
} );

jasmine.getEnv().addReporter( {
	specStarted: result => ( jasmine.currentTest = result ),
	specDone: result => ( jasmine.currentTest = result ),
} );
