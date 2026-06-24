import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppCommercialClassificationMutation() {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( params?: StatsQueryParams ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'commercial-classification',
				method: 'POST',
				// The WPCOM endpoint reads POST inputs from the query string.
				params,
			} ),
		onSuccess: () => {
			// Plan usage lands in a sibling endpoint PR and shares this app query prefix.
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		},
	} );
}
