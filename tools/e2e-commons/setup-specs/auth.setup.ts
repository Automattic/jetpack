/**
 * Internal dependencies
 */
import { test as setup } from '../fixtures/base-test';
import { getCIProjectNameTestTag } from '../utils/formatting';

setup( 'authenticate users', { tag: [ getCIProjectNameTestTag() ] }, async ( { testUtils } ) => {
	await setup.step( 'authenticate local user', async () => {
		await testUtils.authenticateUser( testUtils, testUtils.getSiteCredentials() );
	} );

	await setup.step( 'authenticate wordpress.com user', async () => {
		await testUtils.authenticateUser( testUtils, testUtils.getDotComCredentials(), {
			siteUrl: 'https://wordpress.com',
		} );
	} );
} );
