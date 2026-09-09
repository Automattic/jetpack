import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import type {
	ConnectionErrorMap,
	ConnectionErrorObject,
	ConnectionOwner,
} from '../../use-connection-error-notice/types';

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

const { default: useConnectionStatusSummary, getConnectionErrorScope } = await import( '../index' );

const error = ( overrides: Partial< ConnectionErrorObject > = {} ): ConnectionErrorObject => ( {
	error_code: 'invalid_token',
	error_message: 'Something is wrong.',
	...overrides,
} );

describe( 'getConnectionErrorScope', () => {
	it( 'reports no scope when nothing is broken', () => {
		expect( getConnectionErrorScope( [] ) ).toBeNull();
	} );

	it( 'places a site-audience error on the site', () => {
		expect( getConnectionErrorScope( [ error( { audience: 'site' } ) ] ) ).toBe( 'site' );
	} );

	// The convention `Error_Handler` documents for its own readers: an error from a
	// package too old to send `audience` is site-wide.
	it( 'treats a missing audience as site-wide', () => {
		expect( getConnectionErrorScope( [ error() ] ) ).toBe( 'site' );
	} );

	// Another user's error never reaches the displayable set, so one that did is the
	// viewer's own.
	it( 'places a user-audience error on the viewer’s account', () => {
		expect( getConnectionErrorScope( [ error( { audience: 'user' } ) ] ) ).toBe( 'account' );
	} );

	it( 'places the owner’s error on the owner when the viewer is somebody else', () => {
		expect(
			getConnectionErrorScope( [ error( { audience: 'owner' } ) ], { isOwner: false } )
		).toBe( 'owner-account' );
	} );

	it( 'places the owner’s error on the viewer’s own account when they are the owner', () => {
		expect( getConnectionErrorScope( [ error( { audience: 'owner' } ) ], { isOwner: true } ) ).toBe(
			'account'
		);
	} );

	it( 'reports errors that disagree as mixed', () => {
		expect(
			getConnectionErrorScope( [ error( { audience: 'site' } ), error( { audience: 'user' } ) ] )
		).toBe( 'mixed' );
	} );
} );

type MockedConnection = {
	connectionErrors?: ConnectionErrorMap;
	connectionHealthErrors?: ConnectionErrorMap;
	connectionOwner?: ConnectionOwner | null;
	userConnectionData?: { currentUser?: { id?: number } };
};

describe( 'useConnectionStatusSummary', () => {
	afterEach( () => jest.clearAllMocks() );

	// Named rather than inferred as `{}`, which would let a misspelled key through
	// and quietly mock the healthy case instead.
	const mockConnection = ( overrides: MockedConnection = {} ) =>
		useConnection.mockReturnValue( {
			connectionErrors: {},
			connectionHealthErrors: {},
			connectionOwner: null,
			userConnectionData: { currentUser: { id: 1 } },
			...overrides,
		} );

	it( 'reports a healthy connection as unbroken and unscoped', () => {
		mockConnection();

		const { result } = renderHook( () => useConnectionStatusSummary() );

		expect( result.current ).toEqual( {
			hasConnectionError: false,
			scope: null,
			severity: null,
		} );
	} );

	it( 'reports a broken blog token as a site-scoped error', () => {
		mockConnection( {
			connectionErrors: {
				invalid_token: { 1: error( { audience: 'site', user_id: '1' } ) },
			},
		} );

		const { result } = renderHook( () => useConnectionStatusSummary() );

		expect( result.current ).toEqual( {
			hasConnectionError: true,
			scope: 'site',
			severity: 'error',
		} );
	} );

	// Nobody but the owner can repair it, so the viewer is being told, not asked.
	it( 'softens the owner’s broken token to a warning for everybody else', () => {
		mockConnection( {
			connectionOwner: { id: 2, displayName: 'Owner' },
			connectionErrors: {
				invalid_token: { 2: error( { audience: 'owner', user_id: '2' } ) },
			},
		} );

		const { result } = renderHook( () => useConnectionStatusSummary() );

		expect( result.current ).toEqual( {
			hasConnectionError: true,
			scope: 'owner-account',
			severity: 'warning',
		} );
	} );

	it( 'keeps the owner’s own broken token an actionable account error', () => {
		mockConnection( {
			connectionOwner: { id: 1, displayName: 'Owner' },
			connectionErrors: {
				invalid_token: { 1: error( { audience: 'owner', user_id: '1' } ) },
			},
		} );

		const { result } = renderHook( () => useConnectionStatusSummary() );

		expect( result.current ).toEqual( {
			hasConnectionError: true,
			scope: 'account',
			severity: 'error',
		} );
	} );

	// The filtering is the error-notice hook's; this pins that the summary inherits
	// it rather than reading the raw map.
	it( 'ignores another user’s broken token', () => {
		mockConnection( {
			connectionErrors: {
				invalid_token: { 7: error( { audience: 'user', user_id: '7' } ) },
			},
		} );

		const { result } = renderHook( () => useConnectionStatusSummary() );

		expect( result.current ).toEqual( {
			hasConnectionError: false,
			scope: null,
			severity: null,
		} );
	} );
} );
