import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';

/**
 * WAF Upgrade Seen Mutation
 *
 * @return {UseMutationResult} - Mutation result.
 */
export default function useWafUpgradeSeenMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: API.wafUpgradeSeen,
		onMutate: () => {
			queryClient.setQueryData( [ QUERY_WAF_KEY ], ( currentWaf: object ) => ( {
				...currentWaf,
				upgradeIsSeen: true,
			} ) );
		},
	} );
}
