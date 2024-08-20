import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	QUERY_HAS_PLAN_KEY,
	QUERY_HISTORY_KEY,
	QUERY_SCAN_STATUS_KEY,
	QUERY_WAF_KEY,
	SCAN_STATUS_OPTIMISTICALLY_SCANNING,
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
		onMutate: () => {
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( currentStatus: object ) => {
				return {
					...currentStatus,
					status: SCAN_STATUS_OPTIMISTICALLY_SCANNING,
				};
			} );
		},
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HAS_PLAN_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );
		},
	} );
}
