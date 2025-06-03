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

// Mock window.location to prevent navigation errors in tests
Object.defineProperty( window, 'location', {
	value: {
		href: '',
	},
	writable: true,
} );

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

	const defaultConnectionData = {
		hasConnectionError: false,
		connectionErrorMessage: '',
		connectionError: null,
		connectionErrors: {},
	};

	const defaultRestoreConnection = {
		restoreConnection: mockRestoreConnection,
		isRestoringConnection: false,
		restoreConnectionError: null,
	};

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseConnectionErrorNotice.mockReturnValue( defaultConnectionData );
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
				connectionError: {
					error_code: 'invalid_token',
					error_message: 'Connection failed due to network issue',
					error_type: 'connection',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
				},
				connectionErrors: {
					invalid_token: {
						'1': {
							error_code: 'invalid_token',
							error_message: 'Connection failed due to network issue',
							error_type: 'connection',
							user_id: '1',
							timestamp: Date.now(),
							nonce: 'test-nonce',
						},
					},
				},
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
	} );

	describe( 'when there is a protected owner error', () => {
		beforeEach( () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'The WordPress.com plan owner is missing',
				connectionError: {
					error_code: 'protected_owner',
					error_message: 'The WordPress.com plan owner is missing',
					error_type: 'protected_owner',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
					error_data: {
						email: 'owner@example.com',
						wpcom_user_email: 'owner@example.com',
					},
				},
				connectionErrors: {},
			} );
		} );

		it( 'should set a notice with create missing account action', async () => {
			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith( {
					message: 'The WordPress.com plan owner is missing',
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

		it( 'should record analytics when create missing account is clicked', async () => {
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
		} );

		it( 'should detect protected owner error by error_type field', async () => {
			// Test with different error message but correct error_type
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'Some other error message without keywords',
				connectionError: {
					error_code: 'protected_owner',
					error_message: 'Some other error message without keywords',
					error_type: 'protected_owner',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
					error_data: {
						email: 'owner@example.com',
						wpcom_user_email: 'owner@example.com',
					},
				},
				connectionErrors: {},
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith( {
					message: 'Some other error message without keywords',
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
						priority: 300,
					},
				} );
			} );
		} );

		it( 'should not detect protected owner error with wrong error_type', async () => {
			// Test with message containing keywords but wrong error_type
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'The WordPress.com plan owner has an invalid token',
				connectionError: {
					error_code: 'invalid_token',
					error_message: 'The WordPress.com plan owner has an invalid token',
					error_type: 'connection',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
				},
				connectionErrors: {},
			} );

			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith( {
					message: 'The WordPress.com plan owner has an invalid token',
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
						priority: 300,
					},
				} );
			} );
		} );
	} );

	describe( 'notice priority calculation', () => {
		it( 'should use higher priority when restoring connection', async () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'Connection error',
				connectionError: {
					error_code: 'invalid_token',
					error_message: 'Connection error',
					error_type: 'connection',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
				},
				connectionErrors: {},
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
	} );
} );
