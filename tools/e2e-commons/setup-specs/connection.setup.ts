/**
 * Internal dependencies
 */
import { expect, test } from '../fixtures/base-test';
import logger from '../logger';
import { getCIProjectNameTestTag } from '../utils/formatting';

test( 'connect site', { tag: [ getCIProjectNameTestTag() ] }, async ( { testUtils } ) => {
	// Used to ease development and debugging.
	// Sometimes locally the site is already connected and we want to skip the connection rather than resetting the environment.
	// eslint-disable-next-line playwright/no-conditional-in-test
	if ( process.env.JETPACK_SKIP_CONNECT ) {
		logger.warn( 'Jetpack connection setup skipped by environment variable!' );
	} else {
		await testUtils.connect();
	}

	expect( await testUtils.isSiteConnected() ).toBe( true );
	expect( await testUtils.isUserConnected() ).toBe( true );
} );
