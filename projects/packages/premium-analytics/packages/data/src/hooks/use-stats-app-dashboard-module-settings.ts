import { useMutation } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import { queryClient } from '../providers';
import { statsAppDashboardModuleSettingsQuery } from '../queries/stats-app-dashboard-module-settings-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppDashboardModuleSettings(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppDashboardModuleSettingsQuery( params ), options );
}

export function useStatsAppDashboardModuleSettingsMutation() {
	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'jetpack-stats-dashboard/module-settings',
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( {
				queryKey: [ 'stats-app', 'dashboard-module-settings' ],
			} );
		},
	} );
}
