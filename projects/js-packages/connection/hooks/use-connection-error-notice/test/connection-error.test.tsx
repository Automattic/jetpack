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
const relinkUser = jest.fn( () => Promise.resolve() );
jest.unstable_mockModule( '../../use-restore-connection', () => ( {
	__esModule: true,
	default: () => ( {
		restoreConnection: jest.fn(),
		relinkUser,
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

	it( 'wires notice-link and support-link click tracking with the standard payload', () => {
		mockConnection( {
			connectionErrors: {
				xmlrpc_request_blocked: {
					'0': {
						error_message: 'Blocked',
						error_code: 'xmlrpc_request_blocked',
						audience: 'site',
						error_data: {
							support_link: true,
							notice_link: { label: 'Visit Site Health', url: 'https://example.com/site-health' },
						},
					},
				},
			},
		} );
		const trackingCallback = jest.fn();

		render( <ConnectionError trackingCallback={ trackingCallback } trackingContext="protect" /> );

		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		props.onNoticeLinkClick( {
			label: 'Visit Site Health',
			url: 'https://example.com/site-health',
		} );
		props.onSupportLinkClick();

		expect( trackingCallback ).toHaveBeenCalledWith( 'jetpack_connection_error_notice_link_click', {
			context: 'protect',
			error_code: 'xmlrpc_request_blocked',
			audience: 'site',
			// Stripped to a path — the per-site host and any query never reach Tracks.
			link_url: '/site-health',
		} );
		expect( trackingCallback ).toHaveBeenCalledWith(
			'jetpack_connection_error_notice_support_link_click',
			{ context: 'protect', error_code: 'xmlrpc_request_blocked', audience: 'site' }
		);
	} );

	it( 'attributes each link click to the error that supplied it, not the CTA error', () => {
		// A resolvable error (the CTA's `actionError`) plus a blocked-request error
		// that owns the Site Health and support links. Clicks on those links must
		// report the blocked-request error, not the CTA's `broken_token`.
		mockConnection( {
			connectionErrors: {
				broken_token: {
					'0': { error_message: 'Token broke', error_code: 'broken_token', audience: 'site' },
				},
				xmlrpc_request_blocked: {
					'0': {
						error_message: 'Blocked',
						error_code: 'xmlrpc_request_blocked',
						audience: 'site',
						error_data: {
							support_link: true,
							notice_link: { label: 'Visit Site Health', url: 'https://example.com/site-health' },
						},
					},
				},
			},
		} );
		const trackingCallback = jest.fn();

		render( <ConnectionError trackingCallback={ trackingCallback } trackingContext="protect" /> );

		const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		// The CTA reports the action error…
		props.actions[ 0 ].onClick();
		expect( trackingCallback ).toHaveBeenCalledWith(
			'jetpack_connection_error_notice_reconnect_cta_click',
			expect.objectContaining( { error_code: 'broken_token' } )
		);
		// …while the links report their own source error.
		props.onNoticeLinkClick( {
			label: 'Visit Site Health',
			url: 'https://example.com/site-health',
		} );
		props.onSupportLinkClick();
		expect( trackingCallback ).toHaveBeenCalledWith(
			'jetpack_connection_error_notice_link_click',
			expect.objectContaining( { error_code: 'xmlrpc_request_blocked' } )
		);
		expect( trackingCallback ).toHaveBeenCalledWith(
			'jetpack_connection_error_notice_support_link_click',
			expect.objectContaining( { error_code: 'xmlrpc_request_blocked' } )
		);
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

	describe( "a non-admin's own broken user token", () => {
		const ownTokenError = {
			no_valid_user_token: {
				'7': {
					error_message: 'Your connection is broken.',
					error_code: 'no_valid_user_token',
					user_id: '7',
					audience: 'user',
					error_data: { action: 'none', self_service: 'connect_user' },
				},
			},
		};

		it.each( [
			[ 'unlinks the stored token first', true ],
			[ 'skips the unlink when no token is stored', false ],
		] )( 'offers Reconnect your account and %s', ( _, isConnected ) => {
			mockConnection( {
				connectionErrors: ownTokenError,
				userConnectionData: { currentUser: { id: 7, isConnected } },
			} );

			render( <ConnectionError /> );

			const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
			expect( props.actions ).toHaveLength( 1 );
			expect( props.actions[ 0 ].label ).toBe( 'Reconnect your account' );

			props.actions[ 0 ].onClick();
			expect( relinkUser ).toHaveBeenCalledWith( isConnected );
		} );

		// The notice has one CTA slot, so the first resolvable error in store order takes it.
		it.each( [
			[ 'relink first', [ 'no_valid_user_token', 'plugin_error' ], 'Reconnect your account' ],
			[ 'reporter action first', [ 'plugin_error', 'no_valid_user_token' ], 'Update plugin' ],
		] )( 'takes the CTA from the first of several own errors (%s)', ( _, order, label ) => {
			const errors = {
				...ownTokenError,
				plugin_error: {
					'7': {
						error_message: 'The plugin needs updating.',
						error_code: 'plugin_error',
						user_id: '7',
						audience: 'user',
						error_data: { action: 'update_plugin', action_label: 'Update plugin' },
					},
				},
			};
			mockConnection( {
				connectionErrors: Object.fromEntries( order.map( code => [ code, errors[ code ] ] ) ),
				userConnectionData: { currentUser: { id: 7, isConnected: true } },
			} );

			render( <ConnectionError actionHandlers={ { update_plugin: jest.fn() } } /> );

			const props = ConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
			expect( props.actions.map( action => action.label ) ).toEqual( [ label ] );
			// Both errors are still described, whichever supplies the CTA.
			expect( props.errorGroups ).toHaveLength( 2 );
		} );
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

	it( 'passes the rated severity to the notice', () => {
		mockConnection( {
			connectionErrors: {
				invalid_token: {
					2: { error_message: 'Owner token broken.', audience: 'owner', user_id: '2' },
				},
			},
			connectionOwner: { id: 2, displayName: 'Owner' },
			userConnectionData: { currentUser: { id: 7 } },
		} );

		render( <ConnectionError /> );

		expect( ConnectionErrorNotice.mock.calls[ 0 ][ 0 ].severity ).toBe( 'warning' );
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
