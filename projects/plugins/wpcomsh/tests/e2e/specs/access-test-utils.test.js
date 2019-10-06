const envVars = require( './access-test-utils' );

describe( 'Environment', () => {
	it( 'Should have a AUTH_COOKIE_NAME', async () => {
		expect( !! envVars.AUTH_COOKIE_NAME ).toBe( true );
	} );
	it( 'Should have a user id for a Subscriber user', async () => {
		expect( !! envVars.SUBSCRIBER_USER_ID ).toBe( true );
	} );
	it( 'Should have a rest api nonce for a Subscriber user', async () => {
		expect( !! envVars.SUBSCRIBER_RESTAPI_NONCE ).toBe( true );
	} );
	it( 'Should have an auth cookie for a Subscriber user', async () => {
		expect( !! envVars.SUBSCRIBER_AUTH_COOKIE ).toBe( true );
	} );
} );
