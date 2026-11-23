/**
 * External dependencies
 */
import { pickReportNavigationParams } from '@jetpack-premium-analytics/routing';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useDashboardOriginSearch } from './use-dashboard-origin-search';

type RouteSearch = Record< string, unknown >;

/**
 * The search a link out of this page to another analytics route carries: the report window
 * and the dashboard tab to return to.
 *
 * @return An updater of the current search, for a route link or a navigation.
 */
export function useReportNavigationSearch(): ( current: RouteSearch ) => RouteSearch {
	const dashboardOrigin = useDashboardOriginSearch();

	return useCallback(
		( current: RouteSearch ) => ( {
			...pickReportNavigationParams( current ),
			...dashboardOrigin,
		} ),
		[ dashboardOrigin ]
	);
}
