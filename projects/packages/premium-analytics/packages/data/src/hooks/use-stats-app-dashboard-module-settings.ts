import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import {
	STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT,
	STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME,
	STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION,
	statsAppDashboardModuleSettingsQuery,
} from '../queries/stats-app-dashboard-module-settings-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

export type StatsAppDashboardModuleSettings = {
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

export function useStatsAppDashboardModuleSettings( options?: UseStatsAppOptions ) {
	return useStatsAppQuery< StatsAppDashboardModuleSettings >(
		statsAppDashboardModuleSettingsQuery< StatsAppDashboardModuleSettings >(),
		options
	);
}

export function useStatsAppDashboardModuleSettingsMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( body: StatsAppDashboardModuleSettings ) =>
			fetchStatsProxy< StatsAppDashboardModuleSettings, StatsAppDashboardModuleSettings >( {
				version: STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION,
				endpoint: STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT,
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( {
				queryKey: [ 'stats-app', STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME ],
			} );
		},
	} );
}
