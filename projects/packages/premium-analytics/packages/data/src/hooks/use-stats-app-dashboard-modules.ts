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

export function useStatsAppDashboardModules(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppDashboardModulesQuery( params ), options );
}

export function useStatsAppDashboardModulesMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( body: unknown ) =>
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
