import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatsProxy } from '../api';
import type { UseMutationResult } from '@tanstack/react-query';

export type StatsAppCommercialClassificationParams = Record< string, never >;

export function useStatsAppCommercialClassificationMutation(): UseMutationResult<
	unknown,
	Error,
	StatsAppCommercialClassificationParams | undefined,
	unknown
> {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( params?: StatsAppCommercialClassificationParams ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'commercial-classification',
				method: 'POST',
				params,
			} ),
		onSuccess: () => {
			// Plan usage lands in a sibling endpoint PR and shares this app query prefix.
			queryClient.invalidateQueries( { queryKey: [ 'stats-app', 'plan-usage' ] } );
		},
	} );
}
