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

const NOTICES_QUERY_KEY = [ 'stats-app', 'notices' ];

/**
 * Saves a notice's visibility. The change lands in the cache before the request
 * does, so every mounted copy of the notice hides at once; a failure restores it.
 *
 * @return The mutation.
 */
export function useStatsAppNoticeMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( data: StatsAppNoticeMutationParams ) => updateStatsAppNotice( data ),
		onMutate: async ( data: StatsAppNoticeMutationParams ) => {
			await queryClient.cancelQueries( { queryKey: NOTICES_QUERY_KEY } );
			const previous = queryClient.getQueriesData< StatsAppNotices >( {
				queryKey: NOTICES_QUERY_KEY,
			} );
			queryClient.setQueriesData< StatsAppNotices >( { queryKey: NOTICES_QUERY_KEY }, notices =>
				notices ? { ...notices, [ data.id ]: false } : notices
			);
			return { previous };
		},
		onError: ( _error, _data, context ) => {
			context?.previous.forEach( ( [ queryKey, notices ] ) =>
				queryClient.setQueryData( queryKey, notices )
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: NOTICES_QUERY_KEY } );
		},
	} );
}
