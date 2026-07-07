import { jest } from '@jest/globals';
import { render } from '@testing-library/react';

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

// Mock the presentational notice so these tests assert the wiring (which props
// ConnectionError passes), not the @wordpress/ui rendering.
const ConnectionErrorNotice = jest.fn( () => null );
jest.unstable_mockModule( '../../../components/connection-error-notice', () => ( {
	__esModule: true,
	default: ConnectionErrorNotice,
} ) );

const { ConnectionError } = await import( '../index' );

const mockConnection = overrides =>
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
} );
