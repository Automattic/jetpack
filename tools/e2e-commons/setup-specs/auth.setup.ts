/**
 * Internal dependencies
 */
import { test as setup } from '../fixtures/base-test';

setup(
	'authenticate users',
	{ tag: `@CI_PROJECT: ${ process.env.PROJECT_NAME }` },
	async ( { testUtils } ) => {
		await setup.step( 'authenticate local user', async () => {
			await testUtils.authenticateUser( testUtils, testUtils.getSiteCredentials() );
		} );

		await setup.step( 'authenticate wordpress.com user', async () => {
			await testUtils.authenticateUser( testUtils, testUtils.getDotComCredentials(), {
				siteUrl: 'https://wordpress.com',
			} );
		} );
	}
);
