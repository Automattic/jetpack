import { renderHook } from '@testing-library/react';
import useAnalytics from '../../../hooks/use-analytics';
import usePageView from '../use-page-view';

const recordEvent = jest.fn();
const LOADED = {
	redBubbleAlerts: { 'backup-failure': {} },
	isRedBubbleAlertsLoading: false,
	isRedBubbleAlertsError: false,
};

beforeEach( () => {
	jest.clearAllMocks();
	useAnalytics.mockReturnValue( { recordEvent } );
} );

describe( 'usePageView', () => {
	it( 'records the view once the alerts load, then on each tab change with the previous tab', () => {
		const { rerender } = renderHook( ( { tab, alerts } ) => usePageView( tab, alerts ), {
			initialProps: { tab: 'overview', alerts: { ...LOADED, isRedBubbleAlertsLoading: true } },
		} );
		rerender( { tab: 'overview', alerts: LOADED } );
		rerender( { tab: 'features', alerts: LOADED } );

		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_myjetpack_page_view',
				{ red_bubble_alerts: 'backup-failure', tab_name: 'overview', previous_tab: null },
			],
			[
				'jetpack_myjetpack_page_view',
				{ red_bubble_alerts: 'backup-failure', tab_name: 'features', previous_tab: 'overview' },
			],
		] );
	} );

	it( 'records the view again, with no previous tab, when the admin shell shows My Jetpack again', () => {
		const { rerender } = renderHook( ( { tab } ) => usePageView( tab, LOADED ), {
			initialProps: { tab: 'overview' },
		} );
		rerender( { tab: 'features' } );
		recordEvent.mockClear();

		window.dispatchEvent(
			new CustomEvent( 'jetpack-admin-shell:page-shown', {
				detail: { page: 'my-jetpack', firstShow: false },
			} )
		);

		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_myjetpack_page_view',
				{ red_bubble_alerts: 'backup-failure', tab_name: 'features', previous_tab: null },
			],
		] );
	} );

	it.each( [
		[ 'another tab', '/help', 'help', 'overview' ],
		[ 'the same tab at another URL', '/', 'overview', null ],
	] )(
		'records one view when the admin shell shows My Jetpack again at %s',
		( _, route, tab, previousTab ) => {
			const { rerender } = renderHook( ( { tab: current } ) => usePageView( current, LOADED ), {
				initialProps: { tab: 'overview' },
			} );
			recordEvent.mockClear();

			window.dispatchEvent(
				new CustomEvent( 'jetpack-admin-shell:page-hidden', {
					detail: { page: 'my-jetpack', next: 'jetpack-protect' },
				} )
			);
			rerender( { tab } );
			window.dispatchEvent(
				new CustomEvent( 'jetpack-admin-shell:page-shown', {
					detail: {
						page: 'my-jetpack',
						firstShow: false,
						routeChanged: true,
						url: `https://example.com/wp-admin/admin.php?page=my-jetpack&p=${ encodeURIComponent(
							route
						) }`,
					},
				} )
			);

			expect( recordEvent.mock.calls ).toEqual( [
				[
					'jetpack_myjetpack_page_view',
					{ red_bubble_alerts: 'backup-failure', tab_name: tab, previous_tab: previousTab },
				],
			] );
		}
	);

	it( 'records only the mount when My Jetpack mounts on a return from another screen', () => {
		renderHook( () => usePageView( 'overview', LOADED ) );

		window.dispatchEvent(
			new CustomEvent( 'jetpack-admin-shell:page-shown', {
				detail: {
					page: 'my-jetpack',
					firstShow: false,
					routeChanged: true,
					url: 'https://example.com/wp-admin/admin.php?page=my-jetpack&p=%2Foverview',
				},
			} )
		);

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'records one view, once the alerts load, when the admin shell shows My Jetpack before they do', () => {
		const { rerender } = renderHook( ( { alerts } ) => usePageView( 'overview', alerts ), {
			initialProps: { alerts: { ...LOADED, isRedBubbleAlertsLoading: true } },
		} );

		window.dispatchEvent(
			new CustomEvent( 'jetpack-admin-shell:page-shown', {
				detail: { page: 'my-jetpack', firstShow: false },
			} )
		);
		rerender( { alerts: LOADED } );

		expect( recordEvent.mock.calls ).toEqual( [
			[
				'jetpack_myjetpack_page_view',
				{ red_bubble_alerts: 'backup-failure', tab_name: 'overview', previous_tab: null },
			],
		] );
	} );
} );
