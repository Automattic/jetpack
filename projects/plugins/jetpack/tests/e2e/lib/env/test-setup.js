/**
 * External dependencies
 */
import fs from 'fs';
/**
 * Internal dependencies
 */
import logger from '../logger';
import { execWpCommand } from '../utils-helper';
import {
	connectThroughWPAdmin,
	loginToWpcomIfNeeded,
	loginToWpSite,
} from '../flows/jetpack-connect';
import config from 'config';
import path from 'path';

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

		if ( text.includes( 'is deprecated' ) ) {
			return;
		}

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

// todo do we still need this?
// keep it for the moment and use it to log steps in console, but unless we're
// bringing back Allure or other reporter to use it we might want to remove it
export const step = async ( stepName, fn ) => {
	logger.info( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await setUserAgent();
	observeConsoleLogging();
	await maybePreConnect();
} );

beforeEach( async () => {
	observeConsoleLogging();
} );
