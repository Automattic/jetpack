/* eslint-disable jest/no-export */
/**
 * External dependencies
 */
import fs from 'fs';
/**
 * Internal dependencies
 */
import { logDebugLog, logHTML } from '../page-helper';
import logger from '../logger';
import { execWpCommand } from '../utils-helper';
import {
	connectThroughWPAdmin,
	loginToWpcomIfNeeded,
	loginToWpSite,
} from '../flows/jetpack-connect';
import config from 'config';
import path from 'path';

const { E2E_TIMEOUT, E2E_DEBUG, CI, E2E_LOG_HTML, E2E_RETRY_TIMES } = process.env;
let currentBlock;

const defaultErrorHandler = async ( error, name ) => {
	let filePath;

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

	// Reset context as a workaround to set a custom user agent
	await jestPlaywright.resetContext( {
		userAgent: e2eUserAgent,
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

		const text = message.text();

		if ( config.get( 'consoleIgnore' ).includes( text ) ) {
			return;
		}

		// An exception is made for _blanket_ deprecation warnings: Those
		// which log regardless of whether a deprecated feature is in use.
		// if ( text.includes( 'This is a global warning' ) ) {
		// 	return;
		// }

		// A chrome advisory warning about SameSite cookies is informational
		// about future changes, tracked separately for improvement in core.
		//
		// See: https://core.trac.wordpress.org/ticket/37000
		// See: https://www.chromestatus.com/feature/5088147346030592
		// See: https://www.chromestatus.com/feature/5633521622188032
		// if ( text.includes( 'A cookie associated with a cross-site resource' ) ) {
		// 	return;
		// }

		// Viewing posts on the front end can result in this error, which
		// has nothing to do with Gutenberg.
		// if ( text.includes( 'net::ERR_UNKNOWN_URL_SCHEME' ) ) {
		// 	return;
		// }

		// As of WordPress 5.3.2 in Chrome 79, navigating to the block editor
		// (Posts > Add New) will display a console warning about
		// non - unique IDs.
		// See: https://core.trac.wordpress.org/ticket/23165
		// if ( text.includes( 'elements with non-unique id #_wpnonce' ) ) {
		// 	return;
		// }

		// if ( text.includes( 'Using Toolbar without label prop is deprecated' ) ) {
		// 	return;
		// }

		// if ( text.includes( 'wp.components.IconButton is deprecated' ) ) {
		// 	return;
		// }
		//
		// if ( text.includes( 'Using custom components as toolbar controls is deprecate' ) ) {
		// 	return;
		// }
		//
		// if ( text.includes( 'Button isDefault prop is deprecated' ) ) {
		// 	return;
		// }

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

jest.retryTimes( parseInt( E2E_RETRY_TIMES ) || 0 );

// todo do we still need this?
export const step = async ( stepName, fn ) => {
	// reporter.startStep( stepName );
	await fn();
	// reporter.endStep();
};

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

	await maybePreConnect();
} );

afterAll( async () => {} );
