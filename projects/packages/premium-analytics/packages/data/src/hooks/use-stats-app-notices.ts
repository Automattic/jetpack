import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../providers';
import {
	statsAppNoticesQuery,
	updateStatsAppNotice,
	type StatsAppNoticeMutationParams,
} from '../queries/stats-app-notices-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type { StatsAppNoticeMutationParams } from '../queries/stats-app-notices-query';

export function useStatsAppNotices( params?: StatsQueryParams, options?: UseStatsAppOptions ) {
	return useStatsAppQuery( statsAppNoticesQuery( params ), options );
}

export function useStatsAppNoticeMutation() {
	return useMutation( {
		mutationFn: ( data: StatsAppNoticeMutationParams ) => updateStatsAppNotice( data ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'notices' ] } );
		},
	} );
}
