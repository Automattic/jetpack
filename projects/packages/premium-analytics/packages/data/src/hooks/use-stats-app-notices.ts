import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	statsAppNoticesQuery,
	updateStatsAppNotice,
	type StatsAppNoticeId,
	type StatsAppNoticeMutationParams,
	type StatsAppNoticeMutationResponse,
	type StatsAppNotices,
	type StatsAppNoticesParams,
	type StatsAppNoticeStatus,
} from '../queries/stats-app-notices-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

export type {
	StatsAppNoticeId,
	StatsAppNoticeMutationParams,
	StatsAppNoticeMutationResponse,
	StatsAppNotices,
	StatsAppNoticesParams,
	StatsAppNoticeStatus,
};

export function useStatsAppNotices( params?: StatsAppNoticesParams, options?: UseStatsAppOptions ) {
	return useStatsAppQuery( statsAppNoticesQuery( params ), options );
}

export function useStatsAppNoticeMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( data: StatsAppNoticeMutationParams ) => updateStatsAppNotice( data ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'notices' ] } );
		},
	} );
}
