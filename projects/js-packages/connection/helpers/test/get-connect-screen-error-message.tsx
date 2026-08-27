import { getConnectScreenErrorMessage } from '../get-connect-screen-error-message';

describe( 'getConnectScreenErrorMessage', () => {
	it( 'maps private network error codes to a message', () => {
		expect( getConnectScreenErrorMessage( 'siteurl_private_ip' ) ).toBe(
			'Your site host is on a private network. Sites can connect to WordPress.com only on public sites.'
		);
	} );

	it( 'maps a registration HTTP failure to a message about reaching WordPress.com', () => {
		expect( getConnectScreenErrorMessage( 'register_http_request_failed' ) ).toBe(
			'Your site could not reach WordPress.com. This is usually temporary — try again in a minute. If it keeps happening, ask your hosting provider to allow connections to jetpack.wordpress.com.'
		);
	} );

	it( 'maps WordPress.com server errors, timeouts, and bad responses to a message', () => {
		const message = 'WordPress.com is temporarily unavailable. Please try again in a minute.';
		expect( getConnectScreenErrorMessage( 'wpcom_5??' ) ).toBe( message );
		expect( getConnectScreenErrorMessage( 'wpcom_408' ) ).toBe( message );
		expect( getConnectScreenErrorMessage( 'wpcom_bad_response' ) ).toBe( message );
	} );

	it( 'maps an invalid Jetpack ID response to a message', () => {
		expect( getConnectScreenErrorMessage( 'jetpack_id' ) ).toBe(
			'WordPress.com returned an unexpected response when registering your site. Please try again in a minute.'
		);
	} );

	it( 'returns undefined for unknown error codes', () => {
		expect( getConnectScreenErrorMessage( 'some_unknown_code' ) ).toBeUndefined();
		expect( getConnectScreenErrorMessage( undefined ) ).toBeUndefined();
	} );
} );
