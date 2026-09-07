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
	// The owner of record comes from the `master_user` option server-side, so it
	// stays resolvable when the owner's token is broken — the only state these
	// errors appear in. `currentUser.isMaster` is derived from
	// `Manager::get_connection_owner()` and is false for the owner themselves in
	// exactly that state, so it must not decide ownership.
	describe( 'connection owner', () => {
		const ownerError = {
			connectionErrors: {
				invalid_connection_owner: {
					3: { error_message: 'Owner token broken.', audience: 'owner' },
				},
			},
		};

		it( 'reports the viewer as owner when they match the owner of record', () => {
			mockConnection( {
				...ownerError,
				connectionOwner: { id: 3, displayName: 'Site Owner' },
				userConnectionData: { currentUser: { id: 3, isMaster: false } },
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.isCurrentUserConnectionOwner ).toBe( true );
			expect( result.current.connectionOwner ).toEqual( { id: 3, displayName: 'Site Owner' } );
		} );

		it( 'reports a non-owner viewer as not the owner, while still naming the owner', () => {
			mockConnection( {
				...ownerError,
				connectionOwner: { id: 3, displayName: 'Site Owner' },
				userConnectionData: { currentUser: { id: 7, isMaster: false } },
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.isCurrentUserConnectionOwner ).toBe( false );
			expect( result.current.connectionOwner?.displayName ).toBe( 'Site Owner' );
		} );

		it( 'claims no ownership when the owner identity is withheld from the viewer', () => {
			mockConnection( {
				...ownerError,
				connectionOwner: null,
				userConnectionData: { currentUser: { id: 3, isMaster: false } },
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.connectionOwner ).toBeNull();
			expect( result.current.isCurrentUserConnectionOwner ).toBe( false );
		} );
	} );
	// The CTA must come from an error the viewer can resolve. Storage order is
	// arbitrary, so an informational error arriving first must not strip the CTA
	// from a co-occurring error that is fixable.
	describe( 'action selection across multiple errors', () => {
		const informational = {
			error_message: 'The connection owner must reconnect.',
			audience: 'owner',
			error_data: { action: 'none' },
		};
		const fixable = {
			error_message: 'Your token is broken.',
			audience: 'user',
		};

		it( 'takes the CTA from the fixable error when the informational one is first', () => {
			mockConnection( {
				connectionErrors: {
					invalid_connection_owner: { 3: informational },
					invalid_token: { 7: fixable },
				},
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.actions ).toHaveLength( 1 );
			expect( result.current.actions[ 0 ].label ).toBe( 'Restore Connection' );
		} );

		it( 'offers no CTA when every error is informational', () => {
			mockConnection( {
				connectionErrors: { invalid_connection_owner: { 3: informational } },
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.actions ).toEqual( [] );
		} );

		// Consumers that render a single message pair it with the CTA, so the two must
		// describe the same error whichever order the errors were stored in.
		it.each( [
			[
				'informational first',
				{ invalid_connection_owner: { 3: informational }, invalid_token: { 7: fixable } },
			],
			[
				'fixable first',
				{ invalid_token: { 7: fixable }, invalid_connection_owner: { 3: informational } },
			],
		] )(
			'reports the message of the error the CTA came from — %s',
			( _label, connectionErrors ) => {
				mockConnection( { connectionErrors } );

				const { result } = renderHook( () => useConnectionErrorNotice() );
				expect( result.current.connectionErrorMessage ).toBe( 'Your token is broken.' );
				expect( result.current.connectionError ).toBe( fixable );
				expect( result.current.actions[ 0 ].label ).toBe( 'Restore Connection' );
			}
		);

		it( 'still reports the informational message when nothing is fixable', () => {
			mockConnection( {
				connectionErrors: { invalid_connection_owner: { 3: informational } },
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.hasConnectionError ).toBe( true );
			expect( result.current.connectionErrorMessage ).toBe(
				'The connection owner must reconnect.'
			);
			expect( result.current.actions ).toEqual( [] );
		} );

		it( 'skips a message-less error, which is never rendered, in favour of one that is', () => {
			mockConnection( {
				connectionErrors: {
					unknown_token: { 3: { error_data: { action: 'test_action' } } },
					invalid_token: { 7: fixable },
				},
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.actions[ 0 ].label ).toBe( 'Restore Connection' );
		} );

		// Preferring an actionable error must not reach past the viewer's own errors
		// to somebody else's: only that user can restore their own token, and a
		// reconnect deregisters the site and invalidates every user token without
		// giving them a new one.
		describe( "another user's broken token", () => {
			const othersError = {
				error_message: 'A user token is broken.',
				audience: 'user',
				user_id: '99',
			};
			const viewer = { currentUser: { id: 7, isMaster: false } };

			it( 'is never the error the CTA is taken from', () => {
				mockConnection( {
					connectionErrors: {
						invalid_token: { 99: othersError, 7: { ...othersError, user_id: '7' } },
					},
					userConnectionData: viewer,
				} );

				const { result } = renderHook( () => useConnectionErrorNotice() );
				expect( result.current.connectionError?.user_id ).toBe( '7' );
				expect( result.current.actions ).toHaveLength( 1 );
			} );

			it( 'leaves an informational first error in place rather than reaching past it', () => {
				mockConnection( {
					connectionErrors: {
						invalid_connection_owner: { 3: informational },
						invalid_token: { 99: othersError },
					},
					userConnectionData: viewer,
				} );

				const { result } = renderHook( () => useConnectionErrorNotice() );
				expect( result.current.connectionError ).toBe( informational );
				expect( result.current.actions ).toEqual( [] );
			} );

			it( "does not disown the viewer's own error", () => {
				mockConnection( {
					connectionErrors: { invalid_token: { 7: { ...othersError, user_id: '7' } } },
					userConnectionData: viewer,
				} );

				const { result } = renderHook( () => useConnectionErrorNotice() );
				expect( result.current.actions[ 0 ].label ).toBe( 'Restore Connection' );
			} );

			// With one side of the comparison missing there is no basis for calling the
			// error someone else's, and skipping it would leave the viewer with a
			// message and no way to act on it.
			it.each( [
				[
					'the viewer is unidentified',
					{ connectionErrors: { invalid_token: { 99: othersError } } },
				],
				[
					'the error is unattributed',
					{
						connectionErrors: { invalid_token: { 99: { ...othersError, user_id: undefined } } },
						userConnectionData: viewer,
					},
				],
			] )( 'stays actionable when %s', ( _label, overrides ) => {
				mockConnection( overrides );

				const { result } = renderHook( () => useConnectionErrorNotice() );
				expect( result.current.actions[ 0 ].label ).toBe( 'Restore Connection' );
			} );
		} );

		// The map is server JSON crossing an untyped store; a throw in the hook would
		// take down the whole page rather than just the notice.
		it( 'survives a malformed error map', () => {
			mockConnection( {
				connectionErrors: {
					malformed_token: null,
					no_valid_blog_token: { 3: null },
					invalid_token: { 7: fixable },
				},
			} );

			const { result } = renderHook( () => useConnectionErrorNotice() );
			expect( result.current.actions[ 0 ].label ).toBe( 'Restore Connection' );
		} );
	} );
} );
