import {
	getApiErrorCode,
	getApiErrorStatus,
	shouldRetryApiError,
	StatsResponseShapeError,
} from '../api-error';

// Two envelopes reach the client: our own `WP_Error` responses
// (`{ code, message, data: { status } }`) and WPCOM pass-through errors
// (`{ error, message }`, with the status attached separately by the fetch layer).

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
		// The request itself succeeded; retrying it verbatim reproduces the same
		// unparsable response instead of a different one. A manual Retry (e.g. a
		// still-undeployed endpoint) is the mechanism that actually changes the
		// outcome, so this must not eat the automatic-retry budget.
		expect( shouldRetryApiError( 0, new StatsResponseShapeError( 'bad shape' ) ) ).toBe( false );
	} );

	it( 'still retries an ordinary transient failure', () => {
		expect( shouldRetryApiError( 0, new Error( 'network error' ) ) ).toBe( true );
	} );
} );
