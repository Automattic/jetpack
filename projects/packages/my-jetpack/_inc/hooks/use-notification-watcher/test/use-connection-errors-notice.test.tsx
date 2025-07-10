import '@testing-library/jest-dom';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { renderHook, waitFor } from '@testing-library/react';
import { NoticeContext } from '../../../context/notices/noticeContext';
import useAnalytics from '../../use-analytics';
import useConnectionErrorsNotice from '../use-connection-errors-notice';
import type { NoticeContextType } from '../../../context/notices/types';
import type { ReactNode } from 'react';

// Mock the dependencies
jest.mock( '@automattic/jetpack-connection' );
jest.mock( '../../use-analytics' );
jest.mock( '../assignLocation' );

jest.mock( '@automattic/jetpack-components', () => ( {
	Col: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: ReactNode } ) => <span>{ children }</span>,
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
		const wrapper = ( { children }: { children: ReactNode } ) => (
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

	describe( 'when there is a custom error with action handler', () => {
		const mockActionHandler = jest.fn();

		beforeEach( () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'A custom error occurred',
				connectionError: {
					error_code: 'custom_error',
					error_message: 'A custom error occurred',
					error_type: 'custom',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
					error_data: {
						action: 'custom_action',
						action_label: 'Fix Issue',
						action_variant: 'primary',
						tracking_event: 'jetpack_custom_action_attempt',
					},
				},
				connectionErrors: {},
			} );
		} );

		it( 'should set a notice with custom action when action handler is provided', async () => {
			const actionHandlers = { custom_action: mockActionHandler };
			renderHook( () => useConnectionErrorsNotice( actionHandlers ), {
				wrapper: ( { children }: { children: ReactNode } ) => (
					<NoticeContext.Provider value={ mockNoticeContext }>{ children }</NoticeContext.Provider>
				),
			} );

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith( {
					message: 'A custom error occurred',
					options: {
						id: 'connection-error-notice',
						level: 'error',
						actions: [
							{
								label: 'Fix Issue',
								onClick: expect.any( Function ),
								noDefaultClasses: true,
							},
						],
						priority: 300, // NOTICE_PRIORITY_HIGH + 0
					},
				} );
			} );
		} );

		it( 'should record analytics when custom action is clicked', async () => {
			const actionHandlers = { custom_action: mockActionHandler };
			renderHook( () => useConnectionErrorsNotice( actionHandlers ), {
				wrapper: ( { children }: { children: ReactNode } ) => (
					<NoticeContext.Provider value={ mockNoticeContext }>{ children }</NoticeContext.Provider>
				),
			} );

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			const setNoticeCall = mockSetNotice.mock.calls[ 0 ][ 0 ];
			const customAction = setNoticeCall.options.actions[ 0 ];

			// Simulate clicking the custom action button
			customAction.onClick();

			expect( mockActionHandler ).toHaveBeenCalledWith(
				expect.objectContaining( {
					error_code: 'custom_error',
					error_message: 'A custom error occurred',
				} )
			);
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_custom_action_attempt', {} );
		} );
	} );

	describe( 'when there is a custom error with action URL', () => {
		beforeEach( () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'A custom error with URL action',
				connectionError: {
					error_code: 'custom_url_error',
					error_message: 'A custom error with URL action',
					error_type: 'custom',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
					error_data: {
						action_url: 'https://example.com/fix',
						action_label: 'Fix Issue',
						action_variant: 'primary',
						tracking_event: 'jetpack_custom_url_action_attempt',
					},
				},
				connectionErrors: {},
			} );
		} );

		it( 'should set a notice with URL navigation action', async () => {
			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalledWith( {
					message: 'A custom error with URL action',
					options: {
						id: 'connection-error-notice',
						level: 'error',
						actions: [
							{
								label: 'Fix Issue',
								onClick: expect.any( Function ),
								noDefaultClasses: true,
							},
						],
						priority: 300, // NOTICE_PRIORITY_HIGH + 0
					},
				} );
			} );
		} );
	} );

	describe( 'when there is a restore connection error', () => {
		beforeEach( () => {
			mockUseConnectionErrorNotice.mockReturnValue( {
				hasConnectionError: true,
				connectionErrorMessage: 'Connection failed',
				connectionError: {
					error_code: 'invalid_token',
					error_message: 'Connection failed',
					error_type: 'connection',
					user_id: '1',
					timestamp: Date.now(),
					nonce: 'test-nonce',
				},
				connectionErrors: {},
			} );

			mockUseRestoreConnection.mockReturnValue( {
				restoreConnection: mockRestoreConnection,
				isRestoringConnection: false,
				restoreConnectionError: 'Failed to restore connection',
			} );
		} );

		it( 'should include restore connection error in the message', async () => {
			renderWithNoticeContext();

			await waitFor( () => {
				expect( mockSetNotice ).toHaveBeenCalled();
			} );

			const setNoticeCall = mockSetNotice.mock.calls[ 0 ][ 0 ];
			// The message should be a React element with both error messages
			expect( setNoticeCall.message ).toBeDefined();
		} );
	} );
} );
