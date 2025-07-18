/**
 * Internal dependencies
 */
import {
	connect,
	isConnected,
	saveJetpackPrivateOptionsToStorageState,
} from '../utils/connection-utils.ts';
import { expect, test } from './base-test.ts';

test( 'connect site', async ( { requestUtils } ) => {
	await connect();

	expect( await isConnected( requestUtils ) ).toBe( true );

	await saveJetpackPrivateOptionsToStorageState();
} );
