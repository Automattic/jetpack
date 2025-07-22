/**
 * Internal dependencies
 */
import { connect, isSiteConnected, isUserConnected } from '../utils/connection-utils.ts';
import { expect, test } from './base-test.ts';

test( 'connect Jetpack', async ( { requestUtils } ) => {
	await connect( requestUtils );

	expect( await isSiteConnected( requestUtils ) ).toBe( true );
	expect( await isUserConnected( requestUtils ) ).toBe( true );
} );
