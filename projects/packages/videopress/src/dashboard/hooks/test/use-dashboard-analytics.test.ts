import analytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook } from '@testing-library/react';
import { StrictMode } from '@wordpress/element';
import { useDashboardAnalytics, type DashboardRoute } from '../use-dashboard-analytics';

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

const testWindow = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown };

describe( 'useDashboardAnalytics', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset the per-page-load guard so each test starts fresh.
		delete ( window as unknown as Record< string, unknown > )[ TRACKED_FLAG ];
		delete testWindow.JPVIDEOPRESS_INITIAL_STATE;
		mockedGetScriptData.mockReturnValue( CONNECTED_USER );
	} );

	afterEach( () => {
		delete testWindow.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'identifies the user and records the page-view event on first mount', () => {
		renderHook( () => useDashboardAnalytics( 'overview' ) );

		expect( mockedAnalytics.initialize ).toHaveBeenCalledWith( 7, 'jane' );
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view',
			{ route: 'overview' }
		);
	} );

	it( 'does not fire again when a route stage remounts (tab change)', () => {
		// First mount fires; unmount + remount simulates client-side tab nav.
		renderHook( () => useDashboardAnalytics( 'overview' ) ).unmount();
		renderHook( () => useDashboardAnalytics( 'library' ) );

		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockedAnalytics.initialize ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'still records the page view when no WPCOM user is connected', () => {
		mockedGetScriptData.mockReturnValue( { user: { current_user: {} } } );

		renderHook( () => useDashboardAnalytics( 'library' ) );

		expect( mockedAnalytics.initialize ).not.toHaveBeenCalled();
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view',
			{ route: 'library' }
		);
	} );

	it.each( [ 'overview', 'library', 'settings', 'video', 'video_editor' ] as const )(
		'records %s as the landing route',
		route => {
			renderHook( () => useDashboardAnalytics( route ) );
			expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_videopress_admin_page_view',
				{ route }
			);
		}
	);

	it.each( [ true, false ] )( 'reports free state from access=%s', access => {
		testWindow.JPVIDEOPRESS_INITIAL_STATE = {
			siteData: { hasVideoPressAccess: access },
		};
		renderHook( () => useDashboardAnalytics( 'overview' ) );
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view',
			{ route: 'overview', is_free: ! access }
		);
	} );

	it.each( [ undefined, null, 'false', 0 ] )( 'omits unknown access value %s', access => {
		testWindow.JPVIDEOPRESS_INITIAL_STATE = {
			siteData: { hasVideoPressAccess: access },
		};
		renderHook( () => useDashboardAnalytics( 'overview' ) );
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view',
			{ route: 'overview' }
		);
	} );

	it( 'preserves the initial route across rerenders and StrictMode effects', () => {
		const { rerender } = renderHook( ( { route } ) => useDashboardAnalytics( route ), {
			initialProps: { route: 'video' as DashboardRoute },
			wrapper: StrictMode,
		} );
		rerender( { route: 'video' } );
		rerender( { route: 'settings' } );
		expect( mockedAnalytics.initialize ).toHaveBeenCalledTimes( 1 );
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockedAnalytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_videopress_admin_page_view',
			{ route: 'video' }
		);
	} );
} );
