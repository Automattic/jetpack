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
		async onMutate() {
			// A status poll landing mid-request would undo the optimistic status, so stop it and arm the guard first.
			await queryClient.cancelQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			localStorage.setItem( 'last_requested_scan', Date.now().toString() );

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
			localStorage.removeItem( 'last_requested_scan' );
			// The scan failed to enqueue, invalidate the scan status query to reset the current status.
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
		},
	} );
}
