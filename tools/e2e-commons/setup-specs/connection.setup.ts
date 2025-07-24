/**
 * Internal dependencies
 */
import { expect, test } from '../fixtures/base-test.ts';

test( 'connect site', async ( { testUtils } ) => {
	// await testUtils.connect();

	expect( await testUtils.isSiteConnected() ).toBe( true );
	expect( await testUtils.isUserConnected() ).toBe( true );
} );
