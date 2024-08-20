import { useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_SCAN_STATUS_KEY } from './../../constants';

/**
 * Use Start Scan Mutation
 *
 * @return {object} Mutation object
 */
export default function useStartScanMutation() {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: API.scan,
		onMutate() {
			// Optimistically update the scan status to 'scanning'.
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( currentStatus: object ) => ( {
				...currentStatus,
				status: 'scanning',
			} ) );
		},
		onSettled() {
			// Regardless of the outcome, invalidate the scan status query to trigger a refetch.
			// Wait five seconds to allow the scan time to start.
			setTimeout( () => {
				queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			}, 5_000 );
		},
	} );
}
