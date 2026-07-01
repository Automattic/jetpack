import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import {
	STATS_APP_DASHBOARD_MODULES_ENDPOINT,
	STATS_APP_DASHBOARD_MODULES_NAME,
	STATS_APP_DASHBOARD_MODULES_VERSION,
	statsAppDashboardModulesQuery,
} from '../queries/stats-app-dashboard-modules-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

/**
 * Module keys per dashboard page, mirroring ALLOWED_MODULE_SETTINGS_SCHEMA in
 * wp-content/lib/jetpack-stats-dashboard/class-module-settings.php on WPCOM. The
 * server filters writes against this exact set, so the stored map only ever holds
 * these keys.
 */
export type StatsAppDashboardTrafficModule =
	| 'highlights'
	| 'chart'
	| 'posts-pages'
	| 'referrers'
	| 'countries'
	| 'authors'
	| 'search-terms'
	| 'clicks'
	| 'videos'
	| 'app-promo';

export type StatsAppDashboardInsightsModule =
	| 'year-in-review'
	| 'all-time-highlights'
	| 'latest-post'
	| 'most-popular-post'
	| 'posting-activities'
	| 'all-time-insights'
	| 'tags-categories'
	| 'comments'
	| 'subscribers'
	| 'number-of-subscribers';

export type StatsAppDashboardSubscribersModule =
	| 'all-time-stats'
	| 'chart'
	| 'subscribers-overview'
	| 'subscribers'
	| 'number-of-subscribers';

export type StatsAppDashboardWordAdsModule = 'totals' | 'chart' | 'earning-history' | 'app-promo';

export type StatsAppDashboardStoreModule =
	| 'chart'
	| 'store-stats-table-1'
	| 'store-stats-table-2'
	| 'most-popular-products'
	| 'top-categories'
	| 'most-used-coupons';

export type StatsAppDashboardModuleValue = boolean;

/**
 * The stored on/off visibility toggles, keyed by page then module. Per-module
 * config (e.g. `traffic.highlights.period_in_days`) lives on the separate
 * `module-settings` endpoint, not here.
 *
 * WPCOM serializes an empty page map as `[]` rather than `{}`, and injects
 * `traffic.authors = false` at read time on sites with a single author, so a
 * page value may be absent, empty, or a partial map.
 */
export type StatsAppDashboardModules = {
	traffic?: Partial< Record< StatsAppDashboardTrafficModule, StatsAppDashboardModuleValue > >;
	insights?: Partial< Record< StatsAppDashboardInsightsModule, StatsAppDashboardModuleValue > >;
	subscribers?: Partial<
		Record< StatsAppDashboardSubscribersModule, StatsAppDashboardModuleValue >
	>;
	wordads?: Partial< Record< StatsAppDashboardWordAdsModule, StatsAppDashboardModuleValue > >;
	store?: Partial< Record< StatsAppDashboardStoreModule, StatsAppDashboardModuleValue > >;
};

export type StatsAppDashboardModulesMutationResponse = {
	updated: boolean;
};

/**
 * @example
 * ```tsx
 * const { data: dashboardModules } = useStatsAppDashboardModules();
 * const { mutate: updateDashboardModules } = useStatsAppDashboardModulesMutation();
 *
 * updateDashboardModules( {
 * 	traffic: {
 * 		authors: true,
 * 		'search-terms': false,
 * 	},
 * } );
 * ```
 */
export function useStatsAppDashboardModules( options?: UseStatsAppOptions ) {
	return useStatsAppQuery< StatsAppDashboardModules >(
		statsAppDashboardModulesQuery< StatsAppDashboardModules >(),
		options
	);
}

export function useStatsAppDashboardModulesMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( body: StatsAppDashboardModules ) =>
			fetchStatsProxy< StatsAppDashboardModulesMutationResponse, StatsAppDashboardModules >( {
				version: STATS_APP_DASHBOARD_MODULES_VERSION,
				endpoint: STATS_APP_DASHBOARD_MODULES_ENDPOINT,
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( {
				queryKey: [ 'stats-app', STATS_APP_DASHBOARD_MODULES_NAME ],
			} );
		},
	} );
}
