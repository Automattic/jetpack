import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';

/**
 * Use WAF Upgrade Seen Mutation
 *
 * @return {object} - Mutation object
 */
export default function useWafUpgradeSeenMutation() {
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
