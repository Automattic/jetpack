import { TestUtils } from '.';

/**
 * Utility function to authenticate a user in the WordPress site by sending a POST request to the login endpoint.
 * @param testUtils                - Instance of TestUtils that contains the requestUtils.
 * @param credentials              - User credentials object. It should have `username` and `password` properties.
 * @param credentials.username     - Username of the user to authenticate.
 * @param credentials.password     - Password of the user to authenticate.
 * @param options                  - Optional parameters for the login request.
 * @param options.siteUrl          - Site URL to prepend to the login endpoint.
 * @param options.storageStatePath - Path to the storage state file.
 */
export async function authenticateUser(
	testUtils: TestUtils,
	credentials: { username: string; password: string },
	options: { siteUrl?: string; storageStatePath?: string } = {}
) {
	const { siteUrl = '', storageStatePath = '' } = options;

	await testUtils.requestUtils.request.post( `${ siteUrl ? siteUrl : '.' }/wp-login.php`, {
		form: {
			log: credentials.username,
			pwd: credentials.password,
		},
	} );

	const { STORAGE_STATE_PATH } = process.env;

	await testUtils.requestUtils.request.storageState( {
		path: storageStatePath || STORAGE_STATE_PATH,
	} );
}
