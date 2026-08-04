import '@testing-library/jest-dom';
import { useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { render, renderHook, waitFor } from '@testing-library/react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import useAnalytics from '../../use-analytics';
import { assignLocation } from '../assignLocation';
import useConnectionErrorsNotice from '../use-connection-errors-notice';
import type { NoticeContextType } from '../../../context/notices/types';
import type { ReactNode } from 'react';

// Mock the dependencies. Use a factory for the connection package so its full
// module graph (which touches `window` at import time) isn't loaded here.
jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnectionErrorNotice: jest.fn(),
	getReconnectErrorMessage: jest.fn(
		( error: string ) => `There was an error reconnecting Jetpack. Error: ${ error }`
	),
} ) );
jest.mock( '../../use-analytics' );
jest.mock( '../assignLocation' );

jest.mock( '@automattic/jetpack-components', () => ( {
	Col: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: ReactNode } ) => <span>{ children }</span>,
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,

	sprintf: ( text: string, ...args: ( string | number )[] ) => {
		let next = 0;

		return text.replace( /%(?:(\d+)\$)?([sd])/g, ( _match, position ) =>
			String( position ? args[ Number( position ) - 1 ] : args[ next++ ] )
		);
	},
	isRTL: () => false,
	_x: ( text: string ) => text,
	_n: ( single: string, plural: string, number: number ) => ( number === 1 ? single : plural ),
} ) );

const mockUseConnectionErrorNotice = useConnectionErrorNotice as jest.MockedFunction<
	typeof useConnectionErrorNotice
>;
const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;

describe( 'useConnectionErrorsNotice', () => {
	const mockSetNotice = jest.fn();
	const mockRecordEvent = jest.fn();
	const mockRestoreConnection = jest.fn();

	const mockNoticeContext: NoticeContextType = {
		setNotice: mockSetNotice,
		resetNotice: jest.fn(),
		currentNotice: {
			message: '',
			title: '',
			options: {
				id: '',
				level: 'info',
				actions: [],
				priority: 0,
			},
		},
	};

	const noError = {
		hasConnectionError: false,
		connectionErrorMessage: '',
		connectionError: undefined,
		connectionErrors: {},
		actions: [],
		restoreConnection: mockRestoreConnection,
		isRestoringConnection: false,
		restoreConnectionError: null,
		// The owner of record, surfaced by the connection package from the
		// `master_user` option so it survives the broken owner token these errors
		// always accompany. The viewer (id 7) is not the owner (id 3) by default.
		connectionOwner: { id: 3, displayName: 'Site Owner' },
		isCurrentUserConnectionOwner: false,
		currentUserId: 7,
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUseConnectionErrorNotice.mockReturnValue( noError );
		mockUseAnalytics.mockReturnValue( { recordEvent: mockRecordEvent } );
	} );

	/**
	 * Render the element handed to `setNotice` so its text can be asserted on.
	 *
	 * @return {string} The notice's rendered text content.
	 */
	const getNoticeText = () =>
		render( mockSetNotice.mock.calls[ 0 ][ 0 ].message ).container.textContent;

	const renderWithNoticeContext = ( contextValue = mockNoticeContext ) => {
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<NoticeContext.Provider value={ contextValue }>{ children }</NoticeContext.Provider>
		);

		return renderHook( () => useConnectionErrorsNotice(), { wrapper } );
	};

	it( 'sets no notice when there is no connection error', () => {
		renderWithNoticeContext();
		expect( mockSetNotice ).not.toHaveBeenCalled();
	} );

	it( 'passes My Jetpack tracking/navigation wiring to the owner hook', () => {
		renderWithNoticeContext();

		expect( mockUseConnectionErrorNotice ).toHaveBeenCalledWith(
			expect.objectContaining( {
				navigate: assignLocation,
				reconnectTrackingEvent: 'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click',
				trackingCallback: expect.any( Function ),
			} )
		);
	} );

	it( "guards the tracking callback to only record 'jetpack_'-prefixed events", () => {
		renderWithNoticeContext();

		const { trackingCallback } = mockUseConnectionErrorNotice.mock.calls[ 0 ][ 0 ];
		trackingCallback( 'jetpack_valid_event', {} );
		trackingCallback( 'invalid_event', {} );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_valid_event', {} );
		expect( mockRecordEvent ).not.toHaveBeenCalledWith( 'invalid_event', {} );
	} );

	it( 'maps the resolved actions into a notice, adding noDefaultClasses', async () => {
		const onClick = jest.fn();
		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: 'Connection failed',
			connectionError: { error_message: 'Connection failed' },
			actions: [
				{
					label: 'Restore Connection',
					onClick,
					isLoading: false,
					loadingText: 'Reconnecting Jetpack…',
				},
			],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options ).toEqual( {
			id: 'connection-error-notice',
			level: 'error',
			actions: [
				{
					label: 'Restore Connection',
					onClick,
					isLoading: false,
					loadingText: 'Reconnecting Jetpack…',
					noDefaultClasses: true,
				},
			],
			priority: 300, // NOTICE_PRIORITY_HIGH + 0
			tracksArgs: { error_count: 1, error_code: null, audience: 'site' },
		} );
		expect( getNoticeText() ).toContain( 'Connection failed' );
	} );

	it( 'shows every displayable error, not just the effective one', async () => {
		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: 'The site token is broken.',
			connectionError: {
				error_message: 'The site token is broken.',
				error_code: 'no_valid_blog_token',
				user_id: '0',
				audience: 'site',
			},
			connectionErrors: {
				no_valid_blog_token: {
					0: {
						error_message: 'The site token is broken.',
						error_code: 'no_valid_blog_token',
						user_id: '0',
						audience: 'site',
					},
				},
				invalid_token: {
					7: {
						error_message: 'Your user token is broken.',
						error_code: 'invalid_token',
						user_id: '7',
						audience: 'user',
					},
				},
			},
			actions: [ { label: 'Restore Connection', onClick: jest.fn() } ],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		const noticeText = getNoticeText();

		expect( noticeText ).toContain( 'The site token is broken.' );
		expect( noticeText ).toContain( 'Your user token is broken.' );
		// Each error carries its own scope and raw code.
		expect( noticeText ).toContain( 'Site connection · Error code: no_valid_blog_token' );
		expect( noticeText ).toContain( 'Your account · Error code: invalid_token' );

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe( '2 Jetpack connection errors' );
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs ).toEqual( {
			error_count: 2,
			error_code: 'no_valid_blog_token',
			audience: 'site',
		} );
	} );

	// The backend gives most broken-token errors one generic sentence, so without
	// grouping the notice repeats that sentence once per error.
	it( 'states a shared headline once, with every error listed under it', async () => {
		const sharedMessage =
			"Your connection with WordPress.com seems to be broken. If you're experiencing issues, please try reconnecting.";

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: sharedMessage,
			connectionError: {
				error_message: sharedMessage,
				error_code: 'invalid_connection_owner',
				user_id: '3',
				audience: 'owner',
			},
			connectionErrors: {
				invalid_connection_owner: {
					3: {
						error_message: sharedMessage,
						error_code: 'invalid_connection_owner',
						user_id: '3',
						audience: 'owner',
					},
				},
				invalid_token: {
					7: {
						error_message: sharedMessage,
						error_code: 'invalid_token',
						user_id: '7',
						audience: 'user',
					},
				},
			},
			actions: [],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		const noticeText = getNoticeText();

		expect( noticeText.split( sharedMessage ).length - 1 ).toBe( 1 );
		// Both errors still get their own scope and code beneath the shared headline.
		expect( noticeText ).toContain(
			"Connection owner's account (Site Owner) · Error code: invalid_connection_owner"
		);
		expect( noticeText ).toContain( 'Your account · Error code: invalid_token' );
		// Grouping is presentation only: the error count is unchanged.
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe( '2 Jetpack connection errors' );
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs.error_count ).toBe( 2 );
	} );

	// Several admins can hit one error code. Each is a distinct error, but they
	// all describe the same thing to this viewer, so rendering them verbatim
	// repeats an identical line and reads as a duplication bug.
	it( 'collapses errors that would read identically into one counted line', async () => {
		const otherUsersError = ( userId: string ) => ( {
			error_message: 'A user token is broken.',
			error_code: 'invalid_token',
			user_id: userId,
			audience: 'user' as const,
		} );

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: 'A user token is broken.',
			connectionError: otherUsersError( '99' ),
			connectionErrors: {
				invalid_token: {
					99: otherUsersError( '99' ),
					100: otherUsersError( '100' ),
					101: otherUsersError( '101' ),
				},
			},
			actions: [],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		const noticeText = getNoticeText();

		expect( noticeText ).toContain( "3 other users' accounts · Error code: invalid_token" );
		expect( noticeText ).not.toContain( "Another user's account" );
		// Collapsing is presentation only: the error count is unchanged.
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs.error_count ).toBe( 3 );
	} );

	it( "keeps the viewer's own error distinct from other users' errors", async () => {
		const viewersError = {
			error_message: 'A user token is broken.',
			error_code: 'invalid_token',
			user_id: '7',
			audience: 'user' as const,
		};
		const othersError = { ...viewersError, user_id: '99' };

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: viewersError.error_message,
			connectionError: viewersError,
			connectionErrors: { invalid_token: { 7: viewersError, 99: othersError } },
			actions: [],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		const noticeText = getNoticeText();

		// Same code, but they describe different things to this viewer.
		expect( noticeText ).toContain( 'Your account · Error code: invalid_token' );
		expect( noticeText ).toContain( "Another user's account · Error code: invalid_token" );
	} );

	it( "attributes another admin's token error to them rather than to the viewer", async () => {
		const otherUsersError = {
			error_message: 'A user token is broken.',
			error_code: 'invalid_token',
			user_id: '99',
			audience: 'user' as const,
		};

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: otherUsersError.error_message,
			connectionError: otherUsersError,
			connectionErrors: { invalid_token: { 99: otherUsersError } },
			actions: [],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		expect( getNoticeText() ).toContain( "Another user's account" );
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
			"Jetpack connection error: Another user's account"
		);
	} );

	it( 'names the connection owner for an owner-audience error seen by someone else', async () => {
		const ownerError = {
			error_message: 'The connection owner needs to reconnect.',
			error_code: 'invalid_connection_owner',
			user_id: '3',
			audience: 'owner' as const,
		};

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: ownerError.error_message,
			connectionError: ownerError,
			connectionErrors: { invalid_connection_owner: { 3: ownerError } },
			actions: [],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		expect( getNoticeText() ).toContain( "Connection owner's account (Site Owner)" );
	} );

	it( 'tells the connection owner the broken token is their own', async () => {
		const ownerError = {
			error_message: 'The connection owner needs to reconnect.',
			error_code: 'invalid_connection_owner',
			user_id: '3',
			audience: 'owner' as const,
		};

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: ownerError.error_message,
			connectionError: ownerError,
			connectionErrors: { invalid_connection_owner: { 3: ownerError } },
			actions: [],
			// The viewer is the owner of record, even though the broken token means
			// `userConnectionData.currentUser.isMaster` is false.
			isCurrentUserConnectionOwner: true,
			currentUserId: 3,
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		expect( getNoticeText() ).toContain( 'Your account (connection owner)' );
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
			'Jetpack connection error: Your account (connection owner)'
		);
	} );

	it( 'omits the owner name when the viewer may not see the owner identity', async () => {
		const ownerError = {
			error_message: 'The connection owner needs to reconnect.',
			error_code: 'invalid_connection_owner',
			user_id: '3',
			audience: 'owner' as const,
		};

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: ownerError.error_message,
			connectionError: ownerError,
			connectionErrors: { invalid_connection_owner: { 3: ownerError } },
			actions: [],
			// `connectionOwner` is gated on `jetpack_connect`, so it is null for
			// viewers who shouldn't learn who owns the connection.
			connectionOwner: null,
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		const noticeText = getNoticeText();

		expect( noticeText ).toContain( "Connection owner's account" );
		expect( noticeText ).not.toContain( 'Site Owner' );
	} );

	it( 'increases priority when a restore is in progress', async () => {
		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: 'Connection failed',
			connectionError: { error_message: 'Connection failed' },
			actions: [ { label: 'Restore Connection', onClick: jest.fn() } ],
			isRestoringConnection: true,
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.priority ).toBe( 301 );
	} );

	it( 'renders the reconnect error alongside the connection error message', async () => {
		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: 'Connection failed',
			connectionError: { error_message: 'Connection failed' },
			actions: [ { label: 'Restore Connection', onClick: jest.fn() } ],
			restoreConnectionError: 'Failed to restore connection',
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		const noticeText = getNoticeText();

		expect( noticeText ).toContain(
			'There was an error reconnecting Jetpack. Error: Failed to restore connection'
		);
		expect( noticeText ).toContain( 'Connection failed' );
	} );
} );
