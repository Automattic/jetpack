import {
	getApiErrorCode,
	getApiErrorStatus,
	getStatsPlanErrorReason,
	shouldRetryApiError,
} from '../api-error';

describe( 'getApiErrorStatus', () => {
	it( 'returns status from a top-level status property', () => {
		expect( getApiErrorStatus( { status: 403 } ) ).toBe( 403 );
	} );

	it( 'returns status from WordPress REST error data', () => {
		expect( getApiErrorStatus( { data: { status: 401 } } ) ).toBe( 401 );
	} );

	it( 'returns status from a nested response object', () => {
		expect( getApiErrorStatus( { response: { status: 503 } } ) ).toBe( 503 );
	} );

	it( 'returns null when no numeric status is available', () => {
		expect( getApiErrorStatus( { data: { status: '403' } } ) ).toBeNull();
		expect( getApiErrorStatus( null ) ).toBeNull();
	} );
} );

describe( 'getApiErrorCode', () => {
	it( 'returns a top-level WordPress REST error code', () => {
		expect( getApiErrorCode( { code: 'no_connection' } ) ).toBe( 'no_connection' );
	} );

	it( 'returns a nested data error code', () => {
		expect( getApiErrorCode( { data: { code: 'rest_forbidden' } } ) ).toBe( 'rest_forbidden' );
	} );

	it( 'returns null when no string code is available', () => {
		expect( getApiErrorCode( { code: 403 } ) ).toBeNull();
		expect( getApiErrorCode( null ) ).toBeNull();
	} );
} );

describe( 'shouldRetryApiError', () => {
	it( 'does not retry authentication or authorization errors', () => {
		expect( shouldRetryApiError( 0, { status: 401 } ) ).toBe( false );
		expect( shouldRetryApiError( 0, { data: { status: 403 } } ) ).toBe( false );
	} );

	it( 'retries other errors up to three failures', () => {
		expect( shouldRetryApiError( 0, { status: 500 } ) ).toBe( true );
		expect( shouldRetryApiError( 2, { status: 500 } ) ).toBe( true );
		expect( shouldRetryApiError( 3, { status: 500 } ) ).toBe( false );
	} );
} );

describe( 'getStatsPlanErrorReason', () => {
	it( 'returns upgrade-required for plan-gated authorization errors', () => {
		expect( getStatsPlanErrorReason( { data: { status: 403, code: 'rest_forbidden' } } ) ).toBe(
			'upgrade-required'
		);
	} );

	it( 'returns null for non-plan authorization errors', () => {
		expect( getStatsPlanErrorReason( { status: 403, code: 'no_connection' } ) ).toBeNull();
	} );

	it( 'returns null for non-authorization errors', () => {
		expect( getStatsPlanErrorReason( { status: 500 } ) ).toBeNull();
	} );
} );
