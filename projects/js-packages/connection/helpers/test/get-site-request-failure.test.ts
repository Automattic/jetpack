import { getSiteRequestFailureCause } from '../get-site-request-failure';

describe( 'getSiteRequestFailureCause', () => {
	it.each( [
		[ 'FetchNetworkError', undefined, 'offline' ],
		[ 'JsonParseError', undefined, 'output' ],
		[ 'JsonParseAfterRedirectError', undefined, 'output' ],
		[ 'Api404Error', undefined, 'blocked' ],
		[ 'Api404AfterRedirectError', undefined, 'blocked' ],
		[ 'rest_disabled', 403, 'blocked' ],
		[ 'rest_cookie_invalid_nonce', 403, 'session' ],
		[ 'rest_not_logged_in', undefined, 'session' ],
		[ 'rest_forbidden', 401, 'session' ],
		[ 'rest_forbidden', undefined, 'permission' ],
		[ 'some_plugin_error', 403, 'permission' ],
		[ 'internal_server_error', 500, 'server' ],
		[ 'site_inaccessible', 500, undefined ],
		[ undefined, undefined, undefined ],
	] )( '%s with status %s is %s', ( code, status, cause ) => {
		expect( getSiteRequestFailureCause( code, status ) ).toBe( cause );
	} );
} );
