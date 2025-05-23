import '@testing-library/jest-dom';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import useAnalytics from '../../use-analytics';
import useConnectionErrorsNotice from '../use-connection-errors-notice';
import type { NoticeContextType } from '../../../context/notices/types';

// Mock the dependencies
jest.mock( '@automattic/jetpack-connection' );
jest.mock( '../../use-analytics' );
jest.mock( '@automattic/jetpack-components', () => ( {
	Col: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
} ) );
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
	sprintf: ( text: string, ...args: string[] ) => {
		return text.replace( /%s/g, () => args.shift() );
	},
	isRTL: () => false,
	_x: ( text: string ) => text,
	_n: ( single: string, plural: string, number: number ) => ( number === 1 ? single : plural ),
} ) );

// Mock window object
Object.defineProperty( window, 'location', {
	value: {
		href: '',
	},
	writable: true,
} );

// Mock Initial_State
Object.defineProperty( window, 'Initial_State', {
	value: {
		adminUrl: '/wp-admin/',
	},
	writable: true,
} );

const mockUseConnectionErrorNotice = useConnectionErrorNotice as jest.MockedFunction<
	typeof useConnectionErrorNotice
>;
const mockUseRestoreConnection = useRestoreConnection as jest.MockedFunction<
	typeof useRestoreConnection
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

	const defaultConnectionError = {
		hasConnectionError: false,
		connectionErrorMessage: '',
	};

	const defaultRestoreConnection = {
		restoreConnection: mockRestoreConnection,
		isRestoringConnection: false,
		restoreConnectionError: null,
	};

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseConnectionErrorNotice.mockReturnValue( defaultConnectionError );
		mockUseRestoreConnection.mockReturnValue( defaultRestoreConnection );
		mockUseAnalytics.mockReturnValue( { recordEvent: mockRecordEvent } );
	} );

	const renderWithNoticeContext = ( contextValue = mockNoticeContext ) => {
		const wrapper = ( { children }: { children: React.ReactNode } ) => (
			<NoticeContext.Provider value={ contextValue }>{ children }</NoticeContext.Provider>
		);

		return renderHook( () => useConnectionErrorsNotice(), { wrapper } );
	};

	describe( 'when there are no connection errors', () => {
		it( 'should not set any notice', () => {
			renderWithNoticeContext();
			expect( mockSetNotice ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when there is a standard connection error', () => {
		beforeEach( () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'Connection failed due to network issue',
			} );
		} );

		it( 'should set a notice with restore connection action', async () => {
			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith( {
					message: 'Connection failed due to network issue',
					options: {
						id: 'connection-error-notice',
						level: 'error',
						actions: [
							{
								label: 'Restore Connection',
								onClick: expect.any( Function ),
								isLoading: false,
								loadingText: 'Reconnecting Jetpack…',
								noDefaultClasses: true,
							},
						],
						priority: 300, // NOTICE_PRIORITY_HIGH + 0
					},
				} );
			} );
		} );

		it( 'should call restoreConnection and record analytics when restore button is clicked', async () => {
			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			const setNoticeCall = mockSetNotice.mock.calls[ 0 ][ 0 ];
			const restoreAction = setNoticeCall.options.actions[ 0 ];

			// Simulate clicking the restore button
			restoreAction.onClick();

			expect( mockRestoreConnection ).toHaveBeenCalled();
			expect( mockRecordEvent ).toHaveBeenCalledWith(
				'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click'
			);
		} );

		it( 'should show loading state when restoring connection', async () => {
			mockUseRestoreConnection.mockReturnValue( {
				...defaultRestoreConnection,
				isRestoringConnection: true,
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith(
					expect.objectContaining( {
						options: expect.objectContaining( {
							actions: [
								expect.objectContaining( {
									isLoading: true,
									loadingText: 'Reconnecting Jetpack…',
								} ),
							],
							priority: 301, // NOTICE_PRIORITY_HIGH + 1
						} ),
					} )
				);
			} );
		} );

		it( 'should show restore connection error in message', async () => {
			mockUseRestoreConnection.mockReturnValue( {
				...defaultRestoreConnection,
				restoreConnectionError: 'Failed to restore connection',
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith(
					expect.objectContaining( {
						message: expect.anything(), // Should be a React element with both messages
					} )
				);
			} );
		} );
	} );

	describe( 'when there is a protected owner error', () => {
		const protectedOwnerErrorCases = [
			{
				description: 'plan owner',
				message: 'The WordPress.com plan owner is missing',
			},
			{
				description: 'WordPress.com plan owner',
				message: 'The WordPress.com plan owner needs to be connected',
			},
			{
				description: 'protected owner',
				message: 'This site has a protected owner issue',
			},
		];

		protectedOwnerErrorCases.forEach( ( { description, message } ) => {
			describe( `containing "${ description }"`, () => {
				beforeEach( () => {
					mockUseConnectionErrorNotice.mockReturnValue( {
						hasConnectionError: true,
						connectionErrorMessage: message,
					} );
				} );

				it( 'should set a notice with create missing account action', async () => {
					renderWithNoticeContext();

					await waitFor( () => {
						expect( mockSetNotice ).toHaveBeenCalledWith( {
							message,
							options: {
								id: 'connection-error-notice',
								level: 'error',
								actions: [
									{
										label: 'Create missing account',
										onClick: expect.any( Function ),
										noDefaultClasses: true,
										variant: 'primary',
									},
								],
								priority: 300, // NOTICE_PRIORITY_HIGH + 0
							},
						} );
					} );
				} );

				it( 'should record analytics and redirect when create missing account is clicked', async () => {
					renderWithNoticeContext();

					await waitFor( () => {
						expect( mockSetNotice ).toHaveBeenCalled();
					} );

					const setNoticeCall = mockSetNotice.mock.calls[ 0 ][ 0 ];
					const createAccountAction = setNoticeCall.options.actions[ 0 ];

					// Simulate clicking the create missing account button
					createAccountAction.onClick();

					expect( mockRecordEvent ).toHaveBeenCalledWith(
						'jetpack_my_jetpack_protected_owner_create_account_attempt',
						{}
					);

					expect( window.location.href ).toBe( '/wp-admin/user-new.php' );
				} );
			} );
		} );

		it( 'should use custom adminUrl when available', async () => {
			window.Initial_State = { adminUrl: '/custom-admin/' };

			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'The WordPress.com plan owner is missing',
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			const setNoticeCall = mockSetNotice.mock.calls[ 0 ][ 0 ];
			const createAccountAction = setNoticeCall.options.actions[ 0 ];

			createAccountAction.onClick();

			expect( window.location.href ).toBe( '/custom-admin/user-new.php' );
		} );

		it( 'should fallback to default admin path when Initial_State is undefined', async () => {
			window.Initial_State = undefined;

			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'The WordPress.com plan owner is missing',
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			const setNoticeCall = mockSetNotice.mock.calls[ 0 ][ 0 ];
			const createAccountAction = setNoticeCall.options.actions[ 0 ];

			createAccountAction.onClick();

			expect( window.location.href ).toBe( '/wp-admin/user-new.php' );
		} );
	} );

	describe( 'notice priority calculation', () => {
		it( 'should use higher priority when restoring connection', async () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'Connection error',
			} );

			mockUseRestoreConnection.mockReturnValue( {
				...defaultRestoreConnection,
				isRestoringConnection: true,
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith(
					expect.objectContaining( {
						options: expect.objectContaining( {
							priority: 301, // NOTICE_PRIORITY_HIGH + 1
						} ),
					} )
				);
			} );
		} );

		it( 'should use base priority when not restoring connection', async () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'Connection error',
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith(
					expect.objectContaining( {
						options: expect.objectContaining( {
							priority: 300, // NOTICE_PRIORITY_HIGH + 0
						} ),
					} )
				);
			} );
		} );
	} );

	describe( 'dependency array handling', () => {
		it( 'should re-run effect when dependencies change', async () => {
			const { rerender } = renderWithNoticeContext();

			// Initially no error
			expect( mockSetNotice ).not.toHaveBeenCalled();

			// Add an error
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'New connection error',
			} );

			rerender();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );
		} );
	} );
} );
