/**
 * Internal dependencies
 */
import { connect, saveJetpackPrivateOptionsToStorageState } from '../utils/connection-utils.ts';
import { expect, test } from './base-test.ts';

test( 'connect site', async ( { restApi } ) => {
	await connect();

	expect( restApi.rest( { path: 'jetpack/v4/connection/check' } ) ).toBeDefined();

	await saveJetpackPrivateOptionsToStorageState();
} );
