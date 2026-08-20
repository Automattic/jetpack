import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import {
	STATS_APP_REFERRERS_SPAM_NAME,
	statsAppReferrersMarkSpamMutation,
	statsAppReferrersSpamQuery,
	statsAppReferrersUnmarkSpamMutation,
	type StatsAppReferrersSpamMutationParams,
	type StatsAppReferrersSpamMutationResponse,
	type StatsAppReferrersSpamResponse,
} from '../queries/stats-app-referrers-spam-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

function invalidateReferrersSpamQueries( queryClient: QueryClient ) {
	// Spam mutations affect both the report data and the app-managed spam list.
	queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers' ] } );
	queryClient.invalidateQueries( { queryKey: [ 'stats-app', STATS_APP_REFERRERS_SPAM_NAME ] } );
}

export function useStatsAppReferrersSpam( options?: UseStatsAppOptions ) {
	return useStatsAppQuery< StatsAppReferrersSpamResponse >( statsAppReferrersSpamQuery(), options );
}

export function useStatsAppReferrersMarkSpamMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( params: StatsAppReferrersSpamMutationParams ) =>
			fetchStatsProxy< StatsAppReferrersSpamMutationResponse >( {
				...statsAppReferrersMarkSpamMutation( params ),
			} ),
		onSuccess: () => {
			invalidateReferrersSpamQueries( queryClient );
		},
	} );
}

export function useStatsAppReferrersUnmarkSpamMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( params: StatsAppReferrersSpamMutationParams ) =>
			fetchStatsProxy< StatsAppReferrersSpamMutationResponse >( {
				...statsAppReferrersUnmarkSpamMutation( params ),
			} ),
		onSuccess: () => {
			invalidateReferrersSpamQueries( queryClient );
		},
	} );
}

export type {
	StatsAppReferrersSpamMutationParams,
	StatsAppReferrersSpamMutationResponse,
	StatsAppReferrersSpamResponse,
};
