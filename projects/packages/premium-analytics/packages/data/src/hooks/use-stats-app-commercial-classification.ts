import { useMutation } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import { queryClient } from '../providers';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppCommercialClassificationMutation() {
	return useMutation( {
		mutationFn: ( params?: StatsQueryParams ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'commercial-classification',
				method: 'POST',
				params,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		},
	} );
}
