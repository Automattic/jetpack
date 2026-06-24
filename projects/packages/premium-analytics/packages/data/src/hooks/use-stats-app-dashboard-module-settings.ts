import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import {
	STATS_APP_DASHBOARD_MODULE_SETTINGS_ENDPOINT,
	STATS_APP_DASHBOARD_MODULE_SETTINGS_NAME,
	STATS_APP_DASHBOARD_MODULE_SETTINGS_VERSION,
	statsAppDashboardModuleSettingsQuery,
} from '../queries/stats-app-dashboard-module-settings-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppDashboardModuleSettings(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppDashboardModuleSettingsQuery( params ), options );
}

export function useStatsAppDashboardModuleSettingsMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
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
