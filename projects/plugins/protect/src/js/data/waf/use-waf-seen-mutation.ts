import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';

/**
 * Use WAF Seen Mutation
 *
 * @return {object} - Mutation object
 */
export default function useWafSeenMutation() {
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
