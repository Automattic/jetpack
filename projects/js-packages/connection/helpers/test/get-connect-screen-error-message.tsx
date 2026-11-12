import { render, screen } from '@testing-library/react';
import {
	getConnectScreenErrorMessage,
	getRegistrationErrorCode,
	getRegistrationErrorDescription,
	getRegistrationErrorDisplay,
	getRegistrationErrorSummary,
} from '../get-connect-screen-error-message';

describe( 'getConnectScreenErrorMessage', () => {
	it( 'maps private network error codes to a message', () => {
		expect( getConnectScreenErrorMessage( 'siteurl_private_ip' ) ).toBe(
			'Your site is on a private network, so WordPress.com can’t reach it. Jetpack can only connect sites that are publicly accessible.'
		);
	} );

	it.each( [
		[
			'fail_domain_tld',
			'Your site is on a private network, so WordPress.com can’t reach it. Jetpack can only connect sites that are publicly accessible.',
		],
		[
			'fail_subdomain_wpcom',
			'Your site’s address is on WordPress.com. Jetpack connects WordPress sites hosted elsewhere, so it can’t connect this one.',
		],
		[
			'request_timeout',
			'WordPress.com timed out waiting for your site to answer. Your site may be slow or overloaded, or a firewall may be silently dropping the connection. Try again in a minute. If it keeps happening, ask your hosting provider to check.',
		],
		[
			'bad_redirect_url',
			'Your site redirected WordPress.com to an address it couldn’t use. Check the WordPress Address and Site Address in Settings › General, and any redirect rules on your site or host.',
		],
		[
			'ssl_error',
			'WordPress.com couldn’t make a secure (HTTPS) connection to your site. Its SSL certificate or HTTPS setup may be invalid. Ask your hosting provider to check it.',
		],
	] )( 'maps %s to its own message', ( code, expected ) => {
		expect( getConnectScreenErrorMessage( code ) ).toBe( expected );
	} );

	it( 'maps both timeout codes to the timeout message', () => {
		expect( getConnectScreenErrorMessage( 'connection_timeout' ) ).toBe(
			getConnectScreenErrorMessage( 'request_timeout' )
		);
	} );

	it( 'maps a registration HTTP failure to a message about reaching WordPress.com', () => {
		expect( getConnectScreenErrorMessage( 'register_http_request_failed' ) ).toBe(
			'Your site couldn’t reach WordPress.com. Ask your hosting provider to allow outgoing connections from your site to jetpack.wordpress.com.'
		);
	} );

	it( 'maps WordPress.com server errors and timeouts to a message', () => {
		const message = 'WordPress.com is temporarily unavailable. Please try again in a minute.';
		expect( getConnectScreenErrorMessage( 'wpcom_5??' ) ).toBe( message );
		expect( getConnectScreenErrorMessage( 'wpcom_408' ) ).toBe( message );
	} );

	it( 'does not call an unexpected WordPress.com response an outage', () => {
		expect( getConnectScreenErrorMessage( 'wpcom_bad_response' ) ).toContain(
			'unexpected response from WordPress.com'
		);
		expect( getConnectScreenErrorMessage( 'wpcom_bad_response' ) ).not.toContain( 'temporarily' );
	} );

	it( 'maps the offline mode registration error to the same message as the offline mode flag', () => {
		render( <>{ getConnectScreenErrorMessage( 'offline_mode' ) }</> );
		expect( screen.getByRole( 'link', { name: 'Offline Mode' } ) ).toBeInTheDocument();
		expect( getConnectScreenErrorMessage( 'offline_mode' ) ).toEqual(
			getConnectScreenErrorMessage( undefined, true )
		);
	} );

	it( 'treats the missing connect capability as offline mode when the site is offline', () => {
		// Offline mode takes away jetpack_connect, so an administrator gets this permission error.
		expect(
			getConnectScreenErrorMessage( 'invalid_user_permission_jetpack_connect', true )
		).toEqual( getConnectScreenErrorMessage( undefined, true ) );
		expect( getConnectScreenErrorMessage( 'invalid_user_permission_jetpack_connect' ) ).toContain(
			'Only site administrators'
		);
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
		// A one-off failure can surface as a 403 from the XML-RPC fallback, so retrying comes first.
		expect( getConnectScreenErrorMessage( 'site_inaccessible_403' ) ).toContain(
			'Try again in a minute.'
		);
		expect( getConnectScreenErrorMessage( 'site_inaccessible_429' ) ).toContain(
			'Something blocked WordPress.com'
		);
		expect( getConnectScreenErrorMessage( 'site_inaccessible_404' ) ).toContain(
			'connection endpoint was not found'
		);
		expect( getConnectScreenErrorMessage( 'site_inaccessible_503' ) ).toContain(
			'WordPress.com got an error (HTTP 503)'
		);
		// Cloudflare: 520 is an unexpected origin reply, 521–524 and 530 an unreachable origin, 525–526 SSL.
		expect( getConnectScreenErrorMessage( 'site_inaccessible_520' ) ).toContain(
			'WordPress.com got an error (HTTP 520)'
		);
		for ( const status of [ 521, 522, 523, 524, 530 ] ) {
			expect( getConnectScreenErrorMessage( `site_inaccessible_${ status }` ) ).toBe(
				getConnectScreenErrorMessage( 'site_inaccessible' )
			);
		}
		for ( const status of [ 525, 526 ] ) {
			expect( getConnectScreenErrorMessage( `site_inaccessible_${ status }` ) ).toBe(
				getConnectScreenErrorMessage( 'ssl_error' )
			);
		}
	} );

	it( 'maps WordPress.com failing to reach the site to one message', () => {
		const message = getConnectScreenErrorMessage( 'site_inaccessible' );
		expect( message ).toContain( 'WordPress.com couldn’t reach your site' );
		for ( const code of [ 'connection_refused', 'connection_reset' ] ) {
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
		expect( getConnectScreenErrorMessage( 'xml_rpc-32601' ) ).toContain(
			'couldn’t connect to your site through xmlrpc.php'
		);
		expect( getConnectScreenErrorMessage( 'verify_secrets_mismatch' ) ).toBe(
			'The connection attempt expired or was interrupted, for example by another connection attempt at the same time. Please try again.'
		);
		expect( getConnectScreenErrorMessage( 'registration_state_invalid' ) ).toBe(
			'The connection attempt expired or was interrupted, for example by another connection attempt at the same time. Please try again.'
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

describe( 'getRegistrationErrorDescription', () => {
	it( 'returns the site’s own message', () => {
		expect(
			getRegistrationErrorDescription( {
				response: { code: 'cannot_save_secrets', message: 'Please contact your host.' },
			} )
		).toBe( 'Please contact your host.' );
	} );

	it( 'drops messages that are only an HTTP status, and jetpack_id bodies', () => {
		expect(
			getRegistrationErrorDescription( { response: { code: 'wpcom_5??', message: '503' } } )
		).toBeUndefined();
		expect(
			getRegistrationErrorDescription( {
				response: { code: 'jetpack_id', message: 'Do not publicly post this error message! {…}' },
			} )
		).toBeUndefined();
	} );

	it( 'strips markup and caps the length', () => {
		expect(
			getRegistrationErrorDescription( {
				response: {
					code: 'internal_server_error',
					message: '<p>There has been a critical error.</p>',
				},
			} )
		).toBe( 'There has been a critical error.' );
		const long = getRegistrationErrorDescription( { response: { message: 'x'.repeat( 500 ) } } );
		expect( long ).toHaveLength( 400 );
	} );

	it( 'keeps a message at the limit whole, and cuts a longer one at a word boundary', () => {
		const atLimit = 'a'.repeat( 400 );
		expect( getRegistrationErrorDescription( { response: { message: atLimit } } ) ).toBe( atLimit );
		expect(
			getRegistrationErrorDescription( {
				response: { message: 'a'.repeat( 395 ) + ' https://jetpack.com/support/' },
			} )
		).toBe( 'a'.repeat( 395 ) );
	} );

	it( 'never splits an emoji when capping the length', () => {
		const atLimit = getRegistrationErrorDescription( {
			response: { message: 'x'.repeat( 399 ) + '😀😀' },
		} );
		expect( atLimit ).toBe( 'x'.repeat( 399 ) + '😀' );

		// The 1,000-character pre-cut lands between the emoji's two halves, inside the 400 returned.
		const atPreCut = getRegistrationErrorDescription( {
			response: { message: '<' + 'a'.repeat( 748 ) + '>' + 'x'.repeat( 249 ) + '😀' },
		} );
		expect( atPreCut ).toBe( 'x'.repeat( 249 ) );
	} );
} );

describe( 'getRegistrationErrorDisplay', () => {
	const display = ( code: string, message: string ) =>
		getRegistrationErrorDisplay( { response: { code, message } } );

	it( 'shows only our copy for a mapped code', () => {
		expect(
			display( 'request_cancelled', 'Your site has been generating too many attempts.' )
		).toEqual( { message: getConnectScreenErrorMessage( 'request_cancelled' ) } );
		expect( display( 'rest_cookie_invalid_nonce', 'Cookie check failed' ).detail ).toBeUndefined();
	} );

	it( 'uses the site’s own text as the message for an unmapped code', () => {
		expect( display( 'cannot_save_secrets', 'Please contact your host.' ) ).toEqual( {
			message: 'Please contact your host.',
		} );
		expect( display( 'cannot_save_secrets', '' ) ).toEqual( { message: undefined } );
	} );

	it( 'keeps the cURL error for a failed request to WordPress.com', () => {
		expect(
			display( 'register_http_request_failed', 'cURL error 6: Could not resolve host.' ).detail
		).toBe( 'cURL error 6: Could not resolve host.' );
	} );

	it( 'shows only our copy for a WordPress.com transport error', () => {
		const text =
			'The Jetpack server was unable to communicate with your site https://example.com [REST http_request_failed: cURL error 28: Operation timed out]';
		expect( display( 'request_timeout', text ) ).toEqual( {
			message: getConnectScreenErrorMessage( 'request_timeout' ),
		} );
		expect(
			display(
				'ssl_error',
				'Invalid SSL response [IXR -32300: transport error - SSL_ERROR_SYSCALL]'
			)
		).toEqual( { message: getConnectScreenErrorMessage( 'ssl_error' ) } );
	} );

	it( 'names the URL WordPress.com tried for an HTTP status from the site, in one message', () => {
		const text = ( status: number ) =>
			`The Jetpack server was unable to communicate with your site https://example.com [HTTP ${ status }]. Ask your web host…`;
		expect( display( 'site_inaccessible_503', text( 503 ) ) ).toEqual( {
			message:
				'WordPress.com got an error (HTTP 503) when it tried to verify your site at https://example.com. Your site’s error log may show the cause.',
		} );
		expect( display( 'site_inaccessible_403', text( 403 ) ).message ).toContain(
			'verifying your site at https://example.com (HTTP 403)'
		);
		expect( display( 'site_inaccessible_404', text( 404 ) ).message ).toContain(
			'reached your site at https://example.com, but'
		);
		expect( display( 'site_inaccessible_522', text( 522 ) ).message ).toContain(
			'couldn’t reach your site at https://example.com to verify it'
		);
		expect( display( 'site_inaccessible_526', text( 526 ) ).message ).toContain(
			'connection to your site at https://example.com. Its SSL'
		);
	} );

	it( 'falls back to the message without a URL when WordPress.com’s text has none', () => {
		expect( display( 'site_inaccessible_503', 'Unexpected text.' ) ).toEqual( {
			message: getConnectScreenErrorMessage( 'site_inaccessible_503' ),
		} );
	} );

	it( 'shows nothing extra for a status-only message', () => {
		expect( display( 'wpcom_bad_response', '403' ) ).toEqual( {
			message: getConnectScreenErrorMessage( 'wpcom_bad_response' ),
		} );
	} );

	it( 'names a missing PHP XML extension', () => {
		expect( display( 'xml_extension_missing', 'PHP’s XML extension is not available.' ) ).toEqual( {
			message: expect.stringContaining( 'XML extension' ),
		} );
	} );
} );

describe( 'getRegistrationErrorSummary', () => {
	it( 'prefers the mapped message', () => {
		expect(
			getRegistrationErrorSummary( {
				response: { code: 'request_cancelled', message: 'Server text.' },
			} )
		).toContain( 'too many connection attempts' );
	} );

	it( 'falls back to the site’s own message for unmapped codes', () => {
		expect(
			getRegistrationErrorSummary( {
				response: { code: 'cannot_save_secrets', message: 'Server text.' },
			} )
		).toBe( 'Server text.' );
	} );

	it( 'shows the offline mode message for the permission error on an offline site', () => {
		const permissionError = {
			response: {
				code: 'invalid_user_permission_jetpack_connect',
				message: 'You do not have the correct user permissions to perform this action.',
			},
		};
		render( <>{ getRegistrationErrorSummary( permissionError, true ) }</> );
		expect( screen.getByRole( 'link', { name: 'Offline Mode' } ) ).toBeInTheDocument();
		expect( getRegistrationErrorSummary( permissionError ) ).toContain(
			'Only site administrators'
		);
	} );
} );
