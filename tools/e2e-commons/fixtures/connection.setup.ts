/**
 * Internal dependencies
 */
import { connect, saveJetpackPrivateOptionsToStorageState } from '../utils/connection-utils.ts';
import { expect, test } from './base-test.ts';

test( 'connect site', async ( { requestUtils } ) => {
	await connect();

	expect( requestUtils.rest( { path: 'jetpack/v4/connection/check' } ) ).toBeDefined();

	await saveJetpackPrivateOptionsToStorageState();
} );
