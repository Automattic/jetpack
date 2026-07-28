import { jest } from '@jest/globals';
import { render } from '@testing-library/react';
import type { ConnectionErrorNoticeProps } from '../../../components/connection-error-notice/types';
import type { ReactNode } from 'react';

// The connection store reader — mocked to drive the error inputs.
const useConnection = jest.fn();
jest.unstable_mockModule( '../../../components/use-connection', () => ( {
	__esModule: true,
	default: useConnection,
} ) );

// Restore-connection touches window/REST at import; stub it out.
jest.unstable_mockModule( '../../use-restore-connection', () => ( {
	__esModule: true,
	default: () => ( {
		restoreConnection: jest.fn(),
		isRestoringConnection: false,
		restoreConnectionError: null,
	} ),
} ) );

// Take-over-connection also touches window/REST at import; stub it out and expose the
// handler so tests can assert the built-in take_over_ownership CTA is wired to it.
const takeOverOwnership = jest.fn( () => Promise.resolve() );
jest.unstable_mockModule( '../../use-take-over-connection', () => ( {
	__esModule: true,
	default: () => ( {
		takeOverOwnership,
		isTakingOver: false,
		takeOverError: null,
	} ),
} ) );

// Mock the presentational notice so these tests assert the wiring (which props
// ConnectionError passes), not the @wordpress/ui rendering.
const ConnectionErrorNotice = jest.fn< ( props: ConnectionErrorNoticeProps ) => ReactNode >(
	() => null
);
jest.unstable_mockModule( '../../../components/connection-error-notice', () => ( {
	__esModule: true,
	default: ConnectionErrorNotice,
} ) );

const { ConnectionError } = await import( '../index' );

const mockConnection = ( overrides = {} ) =>
	useConnection.mockReturnValue( {
		connectionErrors: {},
		isRegistered: true,
		isUserConnected: true,
		...overrides,
	} );

// ConnectionError is the exported component consumers render: it wires the hook
// (detection) to the resolver (actions) to the presentational notice.
describe( 'ConnectionError', () => {
	afterEach( () => jest.clearAllMocks() );

	it( 'renders nothing when there is no connection error', () => {
		mockConnection();

		render( <ConnectionError /> );

		expect( ConnectionErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'passes the resolved message and actions to the notice when an error exists', () => {
		mockConnection( {
			connectionErrors: {
				myplugin: {
					'https://example.com': { error_message: 'Connection broke', error_type: 'x' },
				},
			},
		} );

		render( <ConnectionError /> );

		expect( ConnectionErrorNotice ).toHaveBeenCalled();
		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		expect( props.message ).toBe( 'Connection broke' );
		expect( props.actions ).toHaveLength( 1 );
		expect( props.actions[ 0 ].label ).toBe( 'Restore Connection' );
	} );

	it( "renders an informational notice with no CTA when the error action is 'none'", () => {
		mockConnection( {
			connectionErrors: {
				owner_error: {
					'123': {
						error_message: 'The connection owner needs to reconnect their account.',
						error_type: 'xmlrpc',
						error_data: { action: 'none' },
					},
				},
			},
		} );

		render( <ConnectionError /> );

		expect( ConnectionErrorNotice ).toHaveBeenCalled();
		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		expect( props.message ).toBe( 'The connection owner needs to reconnect their account.' );
		expect( props.actions ).toHaveLength( 0 );
		// The default "Restore Connection" fallback must also be suppressed.
		expect( props.restoreConnectionCallback ).toBeNull();
	} );

	it( 'wires the built-in take_over_ownership CTA to the takeover handler', () => {
		mockConnection( {
			connectionErrors: {
				no_valid_user_token: {
					'42': {
						error_message: 'The connection owner needs to reconnect. You can take over ownership.',
						error_type: 'xmlrpc',
						audience: 'owner',
						error_data: { action: 'take_over_ownership' },
					},
				},
			},
		} );

		render( <ConnectionError /> );

		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		expect( props.actions ).toHaveLength( 1 );
		expect( props.actions[ 0 ].label ).toBe( 'Take over ownership' );

		props.actions[ 0 ].onClick();
		expect( takeOverOwnership ).toHaveBeenCalled();
	} );

	it( 'selects the most actionable error (site over owner) when several exist', () => {
		mockConnection( {
			connectionErrors: {
				// Owner error listed first, but a site-wide error should win.
				owner_error: {
					'42': {
						error_message: 'Owner message',
						audience: 'owner',
						error_data: { action: 'take_over_ownership' },
					},
				},
				site_error: {
					'0': { error_message: 'Site message', audience: 'site' },
				},
			},
		} );

		render( <ConnectionError /> );

		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		expect( props.message ).toBe( 'Site message' );
	} );
} );
