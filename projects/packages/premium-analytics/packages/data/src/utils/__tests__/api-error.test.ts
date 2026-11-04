import {
	getApiErrorCode,
	getApiErrorStatus,
	getApiRetryDelay,
	isUserRetryableError,
	shouldRetryApiError,
	StatsResponseShapeError,
} from '../api-error';

// The WooCommerce report proxy passes the WordPress.com `WP_Error` body on with its status.
const TABLES_NOT_READY = {
	code: 'woocommerce_analytics_tables_not_ready',
	message: 'Store analytics data is not ready yet. Please try again shortly.',
	data: { status: 503 },
	status: 503,
};
const SCHEMA_OUTDATED = {
	code: 'woocommerce_analytics_schema_outdated',
	message: 'This report needs a newer version of the store analytics data.',
	data: { status: 400 },
	status: 400,
};

// Two error envelopes reach the client: our own `WP_Error` shape
// (`{ code, data: { status } }`) and WPCOM pass-through (`{ error, message }`).

describe( 'getApiErrorStatus', () => {
	it( 'returns status from a top-level status property', () => {
		expect( getApiErrorStatus( { error: 'unauthorized', status: 403 } ) ).toBe( 403 );
	} );

	it( 'returns status from WordPress REST error data', () => {
		expect( getApiErrorStatus( { code: 'no_connection', data: { status: 401 } } ) ).toBe( 401 );
	} );

	it( 'returns status from a nested response object', () => {
		expect( getApiErrorStatus( { response: { status: 503 } } ) ).toBe( 503 );
	} );

	it( 'returns null when no numeric status is available', () => {
		expect( getApiErrorStatus( { data: { status: '403' } } ) ).toBeNull();
		expect(
			getApiErrorStatus( { error: 'unauthorized', message: 'user cannot view stats' } )
		).toBeNull();
		expect( getApiErrorStatus( null ) ).toBeNull();
	} );
} );

describe( 'getApiErrorCode', () => {
	it( 'returns the code from a WP_Error envelope', () => {
		expect( getApiErrorCode( { code: 'no_connection', data: { status: 403 } } ) ).toBe(
			'no_connection'
		);
	} );

	it( 'returns the code from a WPCOM pass-through envelope', () => {
		expect( getApiErrorCode( { error: 'unauthorized', message: 'user cannot view stats' } ) ).toBe(
			'unauthorized'
		);
	} );

	it( 'returns a nested data error code', () => {
		expect( getApiErrorCode( { data: { code: 'rest_forbidden' } } ) ).toBe( 'rest_forbidden' );
	} );

	it( 'returns null when no string code is available', () => {
		expect( getApiErrorCode( { code: 403 } ) ).toBeNull();
		expect( getApiErrorCode( { error: 403 } ) ).toBeNull();
		expect( getApiErrorCode( null ) ).toBeNull();
	} );
} );

describe( 'shouldRetryApiError', () => {
	it( 'does not retry deterministic failures', () => {
		expect( shouldRetryApiError( 0, { code: 'rest_forbidden', data: { status: 401 } } ) ).toBe(
			false
		);
		expect(
			shouldRetryApiError( 0, {
				error: 'unauthorized',
				message: 'user cannot view stats',
				status: 403,
			} )
		).toBe( false );
		expect(
			shouldRetryApiError( 0, {
				error: 'not_found',
				message: 'The requested resource was not found.',
				status: 404,
			} )
		).toBe( false );
	} );

	it( 'retries other errors up to three failures', () => {
		expect( shouldRetryApiError( 0, { status: 500 } ) ).toBe( true );
		expect( shouldRetryApiError( 2, { status: 500 } ) ).toBe( true );
		expect( shouldRetryApiError( 3, { status: 500 } ) ).toBe( false );
	} );

	it( 'does not auto-retry a sanitizer parse failure', () => {
		// Retrying verbatim reproduces the same unparsable response; only a
		// manual Retry (e.g. after a redeploy) can actually change the outcome.
		expect( shouldRetryApiError( 0, new StatsResponseShapeError( 'bad shape' ) ) ).toBe( false );
	} );

	it( 'still retries an ordinary transient failure', () => {
		expect( shouldRetryApiError( 0, new Error( 'network error' ) ) ).toBe( true );
	} );

	it( 'keeps retrying past three failures while the store analytics tables are created', () => {
		expect( shouldRetryApiError( 3, TABLES_NOT_READY ) ).toBe( true );
		expect( shouldRetryApiError( 19, TABLES_NOT_READY ) ).toBe( true );
		expect( shouldRetryApiError( 20, TABLES_NOT_READY ) ).toBe( false );
	} );

	it( 'does not auto-retry an outdated analytics schema, which only the next sync upgrades', () => {
		expect( shouldRetryApiError( 0, SCHEMA_OUTDATED ) ).toBe( false );
	} );
} );

describe( 'getApiRetryDelay', () => {
	it( 'retries a store waiting for its analytics tables at a steady pace instead of backing off', () => {
		expect( getApiRetryDelay( 5, TABLES_NOT_READY ) ).toBe( 3000 );
	} );

	it( 'backs off other failures', () => {
		expect( getApiRetryDelay( 1, { status: 500 } ) ).toBe( 2000 );
		expect( getApiRetryDelay( 10, { status: 500 } ) ).toBe( 30000 );
	} );
} );

describe( 'isUserRetryableError', () => {
	it( 'offers no manual retry for an outdated analytics schema', () => {
		expect( isUserRetryableError( SCHEMA_OUTDATED ) ).toBe( false );
		expect( isUserRetryableError( TABLES_NOT_READY ) ).toBe( true );
	} );
} );
