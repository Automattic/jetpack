import { useConnection } from '@automattic/jetpack-connection';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
	QUERY_HAS_PLAN_KEY,
	QUERY_HISTORY_KEY,
	QUERY_SCAN_STATUS_KEY,
	QUERY_WAF_KEY,
	SCAN_STATUS_OPTIMISTICALLY_SCANNING,
} from '../constants';

/**
 * Use Site Connection Mutation
 *
 * @return {unknown} Mutation function
 */
export default function useConnectSiteMutation() {
	const queryClient = useQueryClient();
	const { handleRegisterSite } = useConnection( {
		autoTrigger: false,
		from: 'protect',
		redirectUri: null,
		skipUserConnection: true,
	} );

	return useMutation( {
		mutationFn: handleRegisterSite,
		onMutate: () => {
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( currentStatus: object ) => {
				return {
					...currentStatus,
					status: SCAN_STATUS_OPTIMISTICALLY_SCANNING,
				};
			} );
		},
		onSuccess: async () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HAS_PLAN_KEY ] } );
		},
	} );
}
