/**
 * Internal dependencies
 */
import {
	connect,
	isSiteConnected,
	isUserConnected,
	saveJetpackPrivateOptionsToStorageState,
} from '../utils/connection-utils.ts';
import { expect, test } from './base-test.ts';

test( 'connect site', async ( { requestUtils } ) => {
	await connect();

	expect( await isUserConnected( requestUtils ) ).toBe( true );
	expect( await isSiteConnected( requestUtils ) ).toBe( true );

	await saveJetpackPrivateOptionsToStorageState();
} );
