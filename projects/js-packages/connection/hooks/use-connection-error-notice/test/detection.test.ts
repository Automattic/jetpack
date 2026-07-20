import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// The connection store reader — mocked so we can drive the exact error inputs.
const useConnection = jest.fn();
jest.unstable_mockModule( '../../../components/use-connection', () => ( {
	__esModule: true,
	default: useConnection,
} ) );

// Restore-connection touches window/REST at import; stub it out for these tests.
jest.unstable_mockModule( '../../use-restore-connection', () => ( {
	__esModule: true,
	default: () => ( {
		restoreConnection: jest.fn(),
		isRestoringConnection: false,
		restoreConnectionError: null,
	} ),
} ) );

const { default: useConnectionErrorNotice } = await import( '../index' );

const mockConnection = overrides =>
	useConnection.mockReturnValue( {
		connectionErrors: {},
		connectionHealthErrors: {},
		isRegistered: false,
		isUserConnected: false,
		...overrides,
	} );

// useConnectionErrorNotice surfaces user-facing errors from the store's
// `connectionErrors` map. These cases pin which inputs produce a notice.
describe( 'useConnectionErrorNotice — error detection', () => {
	afterEach( () => jest.clearAllMocks() );

	it( 'surfaces a real WPCOM error from the store', () => {
		mockConnection( {
			connectionErrors: {
				myplugin: {
					'https://example.com': {
						error_message: 'Real WPCOM error',
						error_type: 'some_error',
					},
				},
			},
			isRegistered: true,
			isUserConnected: true,
		} );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.hasConnectionError ).toBe( true );
		expect( result.current.connectionErrorMessage ).toBe( 'Real WPCOM error' );
	} );

	it( 'shows nothing when there are no errors in the store', () => {
		mockConnection( { isRegistered: true, isUserConnected: true } );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.hasConnectionError ).toBe( false );
	} );

	it( 'returns the first error when multiple error codes are present', () => {
		mockConnection( {
			connectionErrors: {
				first_code: { 'https://a.example': { error_message: 'First error', error_type: 'a' } },
				second_code: { 'https://b.example': { error_message: 'Second error', error_type: 'b' } },
			},
		} );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.connectionErrorMessage ).toBe( 'First error' );
	} );

	it( 'shows nothing when an error code group is empty', () => {
		mockConnection( { connectionErrors: { some_code: {} } } );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.hasConnectionError ).toBe( false );
		expect( result.current.connectionError ).toBeUndefined();
	} );

	// The store selector falls back to `[]` (an array) in edge cases. The hook
	// normalizes that to an empty map so `connectionErrors` stays honest to its
	// ConnectionErrorMap contract, and no notice is surfaced.
	it( 'normalizes a non-map store value to an empty map', () => {
		mockConnection( { connectionErrors: [] } );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.hasConnectionError ).toBe( false );
		expect( result.current.connectionErrors ).toEqual( {} );
	} );

	// Connection presence flags alone do not produce a notice — only
	// store-reported errors do. Presence is a valid state, not an error.
	it( 'does not surface a notice from connection presence alone', () => {
		mockConnection( { isRegistered: true, isUserConnected: false } );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.hasConnectionError ).toBe( false );
		expect( result.current.connectionError ).toBeUndefined();
	} );

	const HEALTH_ERROR = {
		failed_test__connection_token_health: {
			0: {
				error_code: 'failed_test__connection_token_health',
				error_message: 'The site token could not be validated.',
				error_type: 'connection_health',
			},
		},
	};

	// Health-check failures are opt-in: only a consumer that ran the probe (and
	// passes `includeHealthErrors`) surfaces them, so the page-global health slot
	// is not silently inherited by every other consumer of the shared hook.
	it( 'surfaces a health-check error when opted in and the store has no WPCOM error', () => {
		mockConnection( { connectionErrors: {}, connectionHealthErrors: HEALTH_ERROR } );

		const { result } = renderHook( () =>
			useConnectionErrorNotice( { includeHealthErrors: true } )
		);
		expect( result.current.hasConnectionError ).toBe( true );
		expect( result.current.connectionErrorMessage ).toBe(
			'The site token could not be validated.'
		);
	} );

	// The default: a consumer that never opted in does not inherit the shared
	// health-error slot, even when it is populated.
	it( 'ignores a health-check error by default (no opt-in)', () => {
		mockConnection( { connectionErrors: {}, connectionHealthErrors: HEALTH_ERROR } );

		const { result } = renderHook( () => useConnectionErrorNotice() );
		expect( result.current.hasConnectionError ).toBe( false );
		expect( result.current.connectionError ).toBeUndefined();
	} );

	// Precedence: a real WPCOM store error wins over a health-check error even when
	// health errors are opted in.
	it( 'prefers a store error over a health-check error', () => {
		mockConnection( {
			connectionErrors: {
				real_code: { 1: { error_message: 'Real WPCOM error', error_type: 'a' } },
			},
			connectionHealthErrors: {
				failed_test__outbound_https: {
					0: { error_message: 'Health error', error_type: 'connection_health' },
				},
			},
		} );

		const { result } = renderHook( () =>
			useConnectionErrorNotice( { includeHealthErrors: true } )
		);
		expect( result.current.connectionErrorMessage ).toBe( 'Real WPCOM error' );
	} );
} );
