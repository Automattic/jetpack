import '@testing-library/jest-dom';
import { useConnectionErrorNotice } from '@automattic/jetpack-connection';
import { renderHook, waitFor } from '@testing-library/react';
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
	};

	beforeEach( () => {
		jest.clearAllMocks();
		mockUseConnectionErrorNotice.mockReturnValue( noError );
		mockUseAnalytics.mockReturnValue( { recordEvent: mockRecordEvent } );
	} );

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
			expect( mockSetNotice ).toHaveBeenCalledWith( {
				message: 'Connection failed',
				options: {
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
				},
			} );
		} );
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

		// The message becomes a React element combining both errors.
		expect( mockSetNotice.mock.calls[ 0 ][ 0 ].message ).toBeDefined();
		expect( typeof mockSetNotice.mock.calls[ 0 ][ 0 ].message ).not.toBe( 'string' );
	} );
} );
