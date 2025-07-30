import { TestUtils } from '.';

/**
 * Utility function to authenticate a user in the WordPress site by sending a POST request to the login endpoint.
 * @param testUtils   - Instance of TestUtils that contains the requestUtils.
 * @param credentials - User credentials object. It should have `username` and `password` properties.
 * @param siteUrl     - Optional site URL to prepend to the login endpoint.
 */
export async function authenticateUser( testUtils: TestUtils, credentials, siteUrl = '' ) {
	await testUtils.requestUtils.request.post( `${ siteUrl ? siteUrl : '.' }/wp-login.php`, {
		form: {
			log: credentials.username,
			pwd: credentials.password,
		},
	} );

	const { STORAGE_STATE_PATH } = process.env;

	await testUtils.requestUtils.request.storageState( { path: STORAGE_STATE_PATH } );
}
