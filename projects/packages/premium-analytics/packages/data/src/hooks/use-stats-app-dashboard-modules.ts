import { useMutation } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import { queryClient } from '../providers';
import { statsAppDashboardModulesQuery } from '../queries/stats-app-dashboard-modules-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppDashboardModules(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppDashboardModulesQuery( params ), options );
}

export function useStatsAppDashboardModulesMutation() {
	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'jetpack-stats-dashboard/modules',
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'dashboard-modules' ] } );
		},
	} );
}
