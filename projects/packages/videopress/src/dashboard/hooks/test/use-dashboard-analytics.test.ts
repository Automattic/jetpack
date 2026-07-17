import analytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook } from '@testing-library/react';
import { useDashboardAnalytics } from '../use-dashboard-analytics';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		initialize: jest.fn(),
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
} ) );

const mockedGetScriptData = getScriptData as jest.Mock;
const mockedAnalytics = analytics as unknown as {
	initialize: jest.Mock;
	tracks: { recordEvent: jest.Mock };
};

const TRACKED_FLAG = '__jetpackVideoPressDashboardTracked';

const CONNECTED_USER = { user: { current_user: { wpcom: { ID: 7, login: 'jane' } } } };

describe( 'useDashboardAnalytics', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset the per-page-load guard so each test starts fresh.
		delete ( window as unknown as Record< string, unknown > )[ TRACKED_FLAG ];
		mockedGetScriptData.mockReturnValue( CONNECTED_USER );
	} );

	it( 'identifies the user and records the page-view event on first mount', () => {
		renderHook( () => useDashboardAnalytics() );

		expect( mockedAnalytics.initialize ).toHaveBeenCalledWith( 7, 'jane' );
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view'
		);
	} );

	it( 'does not fire again when a route stage remounts (tab change)', () => {
		// First mount fires; unmount + remount simulates client-side tab nav.
		renderHook( () => useDashboardAnalytics() ).unmount();
		renderHook( () => useDashboardAnalytics() );

		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockedAnalytics.initialize ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'still records the page view when no WPCOM user is connected', () => {
		mockedGetScriptData.mockReturnValue( { user: { current_user: {} } } );

		renderHook( () => useDashboardAnalytics() );

		expect( mockedAnalytics.initialize ).not.toHaveBeenCalled();
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view'
		);
	} );
} );
