import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import {
	STATS_APP_DASHBOARD_MODULES_ENDPOINT,
	STATS_APP_DASHBOARD_MODULES_NAME,
	STATS_APP_DASHBOARD_MODULES_VERSION,
	statsAppDashboardModulesQuery,
} from '../queries/stats-app-dashboard-modules-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

/**
 * Keep the traffic-page subset in sync with
 * wp-content/lib/jetpack-stats-dashboard/class-module-settings.php on WPCOM.
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

export type StatsAppDashboardModuleValue = boolean | Record< string, unknown >;

export type StatsAppDashboardModules = {
	traffic?: Partial< Record< StatsAppDashboardTrafficModule, StatsAppDashboardModuleValue > >;
};

export type StatsAppDashboardModulesSettings = {
	traffic?: {
		highlights?: {
			period_in_days?: 7 | 30;
		};
		chart?: null;
		'posts-pages'?: null;
		referrers?: null;
		countries?: null;
		authors?: null;
		'search-terms'?: null;
		clicks?: null;
		videos?: null;
		'app-promo'?: null;
	};
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
export function useStatsAppDashboardModules(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery< StatsAppDashboardModules >(
		statsAppDashboardModulesQuery< StatsAppDashboardModules >( params ),
		options
	);
}

export function useStatsAppDashboardModulesMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( body: StatsAppDashboardModules ) =>
			fetchStatsProxy( {
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
