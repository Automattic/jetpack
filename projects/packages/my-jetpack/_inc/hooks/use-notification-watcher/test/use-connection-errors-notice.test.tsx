import '@testing-library/jest-dom';
import { useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { render, renderHook, waitFor } from '@testing-library/react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import useAnalytics from '../../use-analytics';
import { assignLocation } from '../assignLocation';
import useConnectionErrorsNotice from '../use-connection-errors-notice';
import type { NoticeContextType } from '../../../context/notices/types';
import type { ConnectionErrorObject } from '@automattic/jetpack-connection';
import type { ReactNode } from 'react';

// Mock the dependencies. Use a factory for the connection package so its full
// module graph (which touches `window` at import time) isn't loaded here.
jest.mock( '@automattic/jetpack-connection', () => {
	// The notice's filtering, its labels and its tracking all depend on these two
	// answers, so stub them away and the behaviour under test goes with them. Take
	// the real implementations rather than restating them here: a hand-copied rule
	// keeps asserting the old behaviour, and passing, after the package changes its
	// mind. Reached by file path because the module graph this factory exists to
	// avoid is the barrel's, not this leaf's.
	const { getConnectionErrorUserScope, isOtherUsersConnectionError } = jest.requireActual(
		'../../../../../../js-packages/connection/hooks/use-connection-error-notice/viewer-scope'
	);

	return {
		useConnectionErrorNotice: jest.fn(),
		getReconnectErrorMessage: jest.fn(
			( error: string ) => `There was an error reconnecting Jetpack. Error: ${ error }`
		),
		getConnectionErrorUserScope,
		isOtherUsersConnectionError,
	};
} );

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
		// With more than one error the title only counts them, so each error carries
		// its own scope beneath the message.
		expect( noticeText ).toContain( 'Site connection' );
		expect( noticeText ).toContain( 'Your account' );

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe( '2 Jetpack Connection errors' );
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs ).toEqual( {
			error_count: 2,
			error_code: 'no_valid_blog_token',
			audience: 'site',
		} );
	} );

	// `GlobalNotice` fires its view event from an effect keyed on `tracksArgs` by
	// identity, so a rebuilt object reports a second view of a notice the user has
	// been looking at all along. Starting a reconnect re-sets this notice at a
	// higher priority, which is that case.
	it( 'reports the same tracksArgs object when the notice is re-set unchanged', async () => {
		const errors = {
			hasConnectionError: true,
			connectionErrorMessage: 'The site token is broken.',
			connectionError: {
				error_message: 'The site token is broken.',
				error_code: 'no_valid_blog_token',
				user_id: '0',
				audience: 'site' as const,
			},
			connectionErrors: {
				no_valid_blog_token: {
					0: {
						error_message: 'The site token is broken.',
						error_code: 'no_valid_blog_token',
						user_id: '0',
						audience: 'site' as const,
					},
				},
			},
			actions: [ { label: 'Restore Connection', onClick: jest.fn() } ],
		};

		mockUseConnectionErrorNotice.mockReturnValue( { ...noError, ...errors } );

		const { rerender } = renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		// The reconnect starts: same errors, higher priority.
		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			...errors,
			isRestoringConnection: true,
		} );
		rerender();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalledTimes( 2 );
		} );

		const [ first, second ] = mockSetNotice.mock.calls;

		expect( second[ 0 ].options.priority ).toBeGreaterThan( first[ 0 ].options.priority );
		expect( second[ 0 ].options.tracksArgs ).toBe( first[ 0 ].options.tracksArgs );
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
		// Both errors still get their own scope beneath the shared headline.
		expect( noticeText ).toContain( "Connection owner's account (Site Owner)" );
		expect( noticeText ).toContain( 'Your account' );
		// Grouping is presentation only: the error count is unchanged.
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe( '2 Jetpack Connection errors' );
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs.error_count ).toBe( 2 );
	} );

	// On a site with ownership locked, the owner's error is informational and the
	// hook hands back a different error for the CTA. Reporting the first error in
	// map order would attribute reconnect clicks to the one no button acts on.
	it( 'reports the error the CTA belongs to, not the first in the map', async () => {
		const actionableError: ConnectionErrorObject = {
			error_message: 'Your connection with WordPress.com seems to be broken.',
			error_code: 'invalid_token',
			user_id: '7',
			audience: 'user',
		};

		mockUseConnectionErrorNotice.mockReturnValue( {
			...noError,
			hasConnectionError: true,
			connectionErrorMessage: actionableError.error_message,
			connectionError: actionableError,
			connectionErrors: {
				invalid_connection_owner: {
					3: {
						error_message: 'The connection owner needs to reconnect their account.',
						error_code: 'invalid_connection_owner',
						user_id: '3',
						audience: 'owner',
						error_data: { action: 'none' },
					},
				},
				invalid_token: { 7: actionableError },
			},
			actions: [ { label: 'Restore Connection', onClick: jest.fn() } ],
		} );

		renderWithNoticeContext();

		await waitFor( () => {
			expect( mockSetNotice ).toHaveBeenCalled();
		} );

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs ).toEqual( {
			error_count: 2,
			error_code: 'invalid_token',
			audience: 'user',
		} );
	} );

	// Another admin's broken token does not affect this site's connection and only
	// that admin can restore it, so reporting it here would pair a problem with a
	// button that cannot fix it.
	describe( "another admin's broken token", () => {
		const otherUsersError = {
			error_message: 'A user token is broken.',
			error_code: 'invalid_token',
			user_id: '99',
			audience: 'user' as const,
		};

		it( 'is left out of the notice', async () => {
			const siteError = {
				error_message: 'The site token is broken.',
				error_code: 'no_valid_blog_token',
				user_id: '0',
				audience: 'site' as const,
			};

			mockUseConnectionErrorNotice.mockReturnValue( {
				...noError,
				hasConnectionError: true,
				connectionErrorMessage: siteError.error_message,
				connectionError: siteError,
				connectionErrors: {
					no_valid_blog_token: { 0: siteError },
					invalid_token: { 99: otherUsersError },
				},
				actions: [ { label: 'Restore Connection', onClick: jest.fn() } ],
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			const noticeText = getNoticeText();

			expect( noticeText ).toContain( 'The site token is broken.' );
			expect( noticeText ).not.toContain( "Another user's account" );
			expect( noticeText ).not.toContain( 'A user token is broken.' );
			// The title and the count describe what is shown, not what was filtered —
			// and with one error left, the title carries the scope on its own.
			expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
				'Jetpack Connection error: Site connection'
			);
			// `getNoticeText` renders the message alone, so this asserts the scope is not
			// repeated below the title that already states it.
			expect( noticeText ).not.toContain( 'Site connection' );
			expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs.error_count ).toBe( 1 );
		} );

		// The hook falls back to the first stored error when nothing else is both
		// renderable and actionable, which can hand back an error this notice
		// filtered out. Tracking it would describe something the viewer never saw.
		it( 'is never the error reported to Tracks', async () => {
			const lockedOwnerError = {
				error_message: 'The connection owner needs to reconnect.',
				error_code: 'invalid_connection_owner',
				user_id: '3',
				audience: 'owner' as const,
				error_data: { action: 'none' },
			};

			mockUseConnectionErrorNotice.mockReturnValue( {
				...noError,
				hasConnectionError: true,
				connectionErrorMessage: otherUsersError.error_message,
				// What the hook fell back to — not something this notice renders.
				connectionError: otherUsersError,
				connectionErrors: {
					invalid_token: { 99: otherUsersError },
					invalid_connection_owner: { 3: lockedOwnerError },
				},
				actions: [],
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			expect( mockSetNotice.mock.calls[ 0 ][ 0 ].options.tracksArgs ).toEqual( {
				error_count: 1,
				error_code: 'invalid_connection_owner',
				audience: 'owner',
			} );
		} );

		it( 'leaves no notice at all when it is the only error there is', async () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				...noError,
				hasConnectionError: true,
				connectionErrorMessage: otherUsersError.error_message,
				connectionError: otherUsersError,
				connectionErrors: { invalid_token: { 99: otherUsersError } },
				actions: [],
			} );

			renderWithNoticeContext();

			expect( mockSetNotice ).not.toHaveBeenCalled();
		} );

		// Without a viewer ID there is no basis for calling the error somebody else's,
		// and dropping it would hide a problem the viewer may well own.
		it( 'is kept when the viewer cannot be identified', async () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				...noError,
				currentUserId: undefined,
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

			// Kept, and described without being handed to anyone: the same reasoning
			// that keeps it rules out naming it as somebody else's.
			expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
				'Jetpack Connection error: User connection'
			);
		} );
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

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
			"Jetpack Connection error: Connection owner's account (Site Owner)"
		);
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

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
			'Jetpack Connection error: Your account (connection owner)'
		);
		// The scope lives in the title alone, so no detail line repeats it below.
		expect( getNoticeText() ).not.toContain( 'Your account (connection owner)' );
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

		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].title ).toBe(
			"Jetpack Connection error: Connection owner's account"
		);
		expect( getNoticeText() ).not.toContain( 'Site Owner' );
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
