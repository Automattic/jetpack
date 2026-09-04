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

	// Only that user can restore their own token, so the notice drops the error —
	// and with nothing left to describe there is no notice at all. Without this,
	// the empty group list falls through to the plain-`message` branch and prints
	// the very error the filtering removed.
	it( 'renders nothing when the only error belongs to another user', () => {
		mockConnection( {
			connectionErrors: {
				invalid_token: {
					99: {
						error_message: 'A user token is broken.',
						audience: 'user',
						user_id: '99',
					},
				},
			},
			userConnectionData: { currentUser: { id: 7 } },
		} );

		render( <ConnectionError /> );

		expect( ConnectionErrorNotice ).not.toHaveBeenCalled();
	} );

	// The scope, the full error list and the links are the hook's to derive, so
	// every `<ConnectionError />` consumer gets them without doing anything.
	it( 'passes the derived title, groups and links to the notice', () => {
		mockConnection( {
			connectionErrors: {
				xmlrpc_request_blocked: {
					0: {
						error_message: 'WordPress.com requests to your site are being blocked.',
						audience: 'site',
						user_id: '0',
						error_data: {
							action: 'none',
							support_link: true,
							notice_link: { label: 'Visit Site Health', url: '/wp-admin/site-health.php' },
						},
					},
				},
				invalid_token: {
					7: { error_message: 'Token broken.', audience: 'user', user_id: '7' },
				},
			},
			userConnectionData: { currentUser: { id: 7 } },
		} );

		render( <ConnectionError /> );

		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		expect( props.context ).toBe( '2 Jetpack Connection errors' );
		expect( props.errorGroups.map( group => group.message ) ).toEqual( [
			'WordPress.com requests to your site are being blocked.',
			'Token broken.',
		] );
		expect( props.showSupportLink ).toBe( true );
		// Attached to the group whose error asked for it, not pooled across groups.
		expect( props.errorGroups[ 0 ].noticeLinks ).toEqual( [
			{ label: 'Visit Site Health', url: '/wp-admin/site-health.php' },
		] );
		expect( props.errorGroups[ 1 ].noticeLinks ).toEqual( [] );
	} );

	// A feature's own framing is more specific than the shared title, and there is
	// only one slot for it.
	it( 'prefers a consumer-supplied context over the derived title', () => {
		mockConnection( {
			connectionErrors: {
				invalid_token: { 0: { error_message: 'Token broken.', audience: 'site' } },
			},
		} );

		render( <ConnectionError context="Backup needs your connection" /> );

		expect( ConnectionErrorNotice.mock.calls[ 0 ][ 0 ].context ).toBe(
			'Backup needs your connection'
		);
	} );
} );
