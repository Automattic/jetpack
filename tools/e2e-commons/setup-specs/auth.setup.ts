/**
 * Internal dependencies
 */
import { test as setup } from '../fixtures/base-test';
import { getDotComCredentials, getSiteCredentials } from '../helpers/utils-helper';

setup( 'authenticate users', async ( { testUtils } ) => {
	await setup.step( 'authenticate local user', async () => {
		await testUtils.authenticateUser( testUtils, getSiteCredentials() );
	} );

	await setup.step( 'authenticate wordpress.com user', async () => {
		await testUtils.authenticateUser( testUtils, getDotComCredentials(), 'https://wordpress.com' );
	} );
} );
