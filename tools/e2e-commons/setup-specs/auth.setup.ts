/**
 * Internal dependencies
 */
import { test as setup } from '../fixtures/base-test.ts';

setup( 'authenticate users', async ( { testUtils } ) => {
	await setup.step( 'authenticate local user', async () => {
		await testUtils.authenticateUser( testUtils, testUtils.getSiteCredentials() );
	} );

	await setup.step( 'authenticate wordpress.com user', async () => {
		await testUtils.authenticateUser(
			testUtils,
			testUtils.getDotComCredentials(),
			'https://wordpress.com'
		);
	} );
} );
