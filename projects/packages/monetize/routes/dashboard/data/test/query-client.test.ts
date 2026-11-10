import { shouldRetry } from '../query-client';
import { WpcomApiError } from '../wpcom-request';

describe( 'shouldRetry', () => {
	it.each( [
		[ 'a 4xx', new WpcomApiError( 'rest_forbidden', '', 403 ), 0, false ],
		[ 'a 5xx', new WpcomApiError( 'http_error', '', 502 ), 0, true ],
		[ 'an error with no status', new WpcomApiError( 'fetch_error', '' ), 0, true ],
		[ 'a 5xx after three failures', new WpcomApiError( 'http_error', '', 502 ), 3, false ],
	] )( 'for %s, retries: %p', ( _case, error, failureCount, expected ) => {
		expect( shouldRetry( failureCount, error ) ).toBe( expected );
	} );
} );
