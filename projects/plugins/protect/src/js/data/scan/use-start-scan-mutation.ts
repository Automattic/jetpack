import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import API from '../../api';
import { QUERY_SCAN_STATUS_KEY, SCAN_STATUS_OPTIMISTICALLY_SCANNING } from './../../constants';

/**
 * Use Start Scan Mutation
 *
 * @return {UseMutationResult} Mutation result.
 */
export default function useStartScanMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	return useMutation( {
		mutationFn: API.scan,
		onMutate() {
			// Optimistically update the scan status to 'scanning'.
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( currentStatus: object ) => ( {
				...currentStatus,
				status: SCAN_STATUS_OPTIMISTICALLY_SCANNING,
			} ) );
		},
		onSuccess() {
			// The scan has been enqueued successfully, ensure the scan status is still 'scanning'.
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( currentStatus: object ) => ( {
				...currentStatus,
				status: SCAN_STATUS_OPTIMISTICALLY_SCANNING,
			} ) );

			localStorage.setItem( 'last_requested_scan', Date.now().toString() );
		},
		onError() {
			// The scan failed to enqueue, invalidate the scan status query to reset the current status.
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
		},
	} );
}
