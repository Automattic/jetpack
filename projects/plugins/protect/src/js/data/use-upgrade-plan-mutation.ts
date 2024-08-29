import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	QUERY_CREDENTIALS_KEY,
	QUERY_HAS_PLAN_KEY,
	QUERY_HISTORY_KEY,
	QUERY_SCAN_STATUS_KEY,
	QUERY_WAF_KEY,
} from '../constants';

/**
 * Use Upgrade Plan Mutation
 *
 * @param {object}   props            - Props
 * @param {Function} props.mutationFn - Mutation function
 * @return {unknown} Mutation function
 */
export default function useUpgradePlanMutation( {
	mutationFn,
}: {
	mutationFn: ( args?: unknown ) => unknown;
} ) {
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: async () => mutationFn(),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HAS_PLAN_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_CREDENTIALS_KEY ] } );
		},
	} );
}
