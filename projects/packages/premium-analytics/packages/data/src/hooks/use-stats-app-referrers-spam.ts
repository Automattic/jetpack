import { useMutation } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import { queryClient } from '../providers';
import { statsAppReferrersSpamQuery } from '../queries/stats-app-referrers-spam-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

function invalidateReferrersSpamQueries() {
	// Spam mutations affect both the report data and the app-managed spam list.
	queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers' ] } );
	queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'referrers-spam' ] } );
}

export function useStatsAppReferrersSpam( options?: UseStatsAppOptions ) {
	return useStatsAppQuery( statsAppReferrersSpamQuery(), options );
}

export function useStatsAppReferrersMarkSpamMutation() {
	return useMutation( {
		mutationFn: ( domain: string ) =>
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/referrers/spam/new',
				method: 'POST',
				params: { domain },
			} ),
		onSuccess: () => {
			invalidateReferrersSpamQueries();
		},
	} );
}

export function useStatsAppReferrersUnmarkSpamMutation() {
	return useMutation( {
		mutationFn: ( domain: string ) =>
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/referrers/spam/delete',
				method: 'POST',
				params: { domain },
			} ),
		onSuccess: () => {
			invalidateReferrersSpamQueries();
		},
	} );
}
