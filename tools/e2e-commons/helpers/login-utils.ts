/**
 * Utility function to authenticate a user in the WordPress site by sending a POST request to the login endpoint.
 * @param request     - Playwright request object.
 * @param credentials - User credentials object. It should have `username` and `password` properties.
 */
export async function authenticateUser( request, credentials ) {
	await request.post( './wp-login.php', {
		form: {
			log: credentials.username,
			pwd: credentials.password,
		},
	} );

	const { STORAGE_STATE_PATH } = process.env;

	await request.storageState( { path: STORAGE_STATE_PATH } );
}
