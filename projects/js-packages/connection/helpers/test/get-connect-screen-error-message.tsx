import {
	getConnectScreenErrorMessage,
	getRegistrationErrorCode,
} from '../get-connect-screen-error-message';

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

	it( 'maps WordPress.com verification HTTP errors by status', () => {
		expect( getConnectScreenErrorMessage( 'site_inaccessible_403' ) ).toContain(
			'Something blocked WordPress.com'
		);
		expect( getConnectScreenErrorMessage( 'site_inaccessible_403' ) ).toContain( '(HTTP 403)' );
		expect( getConnectScreenErrorMessage( 'site_inaccessible_520' ) ).toContain(
			'Something blocked WordPress.com'
		);
		expect( getConnectScreenErrorMessage( 'site_inaccessible_404' ) ).toContain(
			'connection endpoint was not found'
		);
		expect( getConnectScreenErrorMessage( 'site_inaccessible_503' ) ).toContain(
			'Your site returned an error (HTTP 503)'
		);
	} );

	it( 'maps WordPress.com failing to reach the site to one message', () => {
		const message = getConnectScreenErrorMessage( 'site_inaccessible' );
		expect( message ).toContain( 'WordPress.com couldn’t reach your site' );
		for ( const code of [
			'request_timeout',
			'connection_timeout',
			'connection_refused',
			'connection_reset',
		] ) {
			expect( getConnectScreenErrorMessage( code ) ).toBe( message );
		}
		expect( getConnectScreenErrorMessage( 'host_lookup_fail' ) ).toContain( 'domain' );
		expect( getConnectScreenErrorMessage( 'ssl_error' ) ).toContain( 'SSL certificate' );
	} );

	it( 'maps other WordPress.com rejections to a message', () => {
		expect( getConnectScreenErrorMessage( 'request_cancelled' ) ).toContain(
			'too many connection attempts'
		);
		expect( getConnectScreenErrorMessage( 'site_requires_authorization' ) ).toContain( 'log in' );
		expect( getConnectScreenErrorMessage( 'xml_rpc-32700' ) ).toContain( 'xmlrpc.php' );
		expect( getConnectScreenErrorMessage( 'verify_secrets_mismatch' ) ).toBe(
			'The connection attempt expired or was interrupted. Please try again.'
		);
		expect( getConnectScreenErrorMessage( 'registration_state_invalid' ) ).toBe(
			'The connection attempt expired or was interrupted. Please try again.'
		);
	} );

	it( 'maps failures of the site’s own REST request to a message', () => {
		expect( getConnectScreenErrorMessage( 'JsonParseError' ) ).toContain( 'unexpected response' );
		expect( getConnectScreenErrorMessage( 'Api404Error' ) ).toContain(
			'REST API couldn’t be reached'
		);
		expect( getConnectScreenErrorMessage( 'FetchNetworkError' ) ).toContain(
			'Your browser couldn’t complete'
		);
		expect( getConnectScreenErrorMessage( 'rest_cookie_invalid_nonce' ) ).toContain(
			'session expired'
		);
		expect( getConnectScreenErrorMessage( 'internal_server_error' ) ).toContain( 'critical error' );
	} );

	it( 'returns undefined for unknown error codes', () => {
		expect( getConnectScreenErrorMessage( 'some_unknown_code' ) ).toBeUndefined();
		expect( getConnectScreenErrorMessage( undefined ) ).toBeUndefined();
	} );
} );

describe( 'getRegistrationErrorCode', () => {
	it( 'prefers the code from the REST response', () => {
		expect(
			getRegistrationErrorCode( { name: 'ApiError', response: { code: 'site_inaccessible_403' } } )
		).toBe( 'site_inaccessible_403' );
	} );

	it( 'falls back to the error name when the response could not be read', () => {
		expect( getRegistrationErrorCode( { name: 'JsonParseError' } ) ).toBe( 'JsonParseError' );
	} );

	it( 'returns undefined without an error', () => {
		expect( getRegistrationErrorCode( undefined ) ).toBeUndefined();
	} );
} );
