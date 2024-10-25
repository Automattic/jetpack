import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';

/**
 * WAF Seen Mutation Hook
 *
 * @return {UseMutationResult} - Mutation result.
 */
export default function useWafSeenMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: API.wafSeen,
		onMutate: () => {
			queryClient.setQueryData( [ QUERY_WAF_KEY ], ( currentWaf: object ) => ( {
				...currentWaf,
				isSeen: true,
			} ) );
		},
	} );
}
