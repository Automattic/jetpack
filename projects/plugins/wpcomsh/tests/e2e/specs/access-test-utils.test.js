const envVars = require( './access-test-utils' );

describe( 'Environment', () => {
	it( 'Should have an auth cookie Name', async () => {
		expect( envVars.AUTH_COOKIE_NAME ).toBeTruthy();
	} );
	it( 'Should have a user id for a Subscriber user', async () => {
		expect( envVars.SUBSCRIBER_USER_ID ).toBeTruthy();
	} );
	it( 'Should have a rest api nonce for a Subscriber user', async () => {
		expect( envVars.SUBSCRIBER_RESTAPI_NONCE ).toBeTruthy();
	} );
	it( 'Should have an auth cookie for a Subscriber user', async () => {
		expect( envVars.SUBSCRIBER_AUTH_COOKIE ).toBeTruthy();
	} );
} );
