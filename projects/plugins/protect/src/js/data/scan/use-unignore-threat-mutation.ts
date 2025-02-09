import { ScanStatus } from '@automattic/jetpack-scan';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Use Un-Ignore Threat Mutatation
 *
 * @return {UseMutationResult} Mutation result.
 */
export default function useUnIgnoreThreatMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.unIgnoreThreat,
		onMutate: async ( threatId: number ) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			await queryClient.cancelQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );

			// Snapshot the current value
			const previousHistory = queryClient.getQueryData< ScanStatus >( [ QUERY_HISTORY_KEY ] );
			const previousScanStatus = queryClient.getQueryData< ScanStatus >( [
				QUERY_SCAN_STATUS_KEY,
			] );

			// Optimistically update to the new value
			queryClient.setQueryData( [ QUERY_HISTORY_KEY ], ( old?: ScanStatus ) => {
				if ( ! old ) {
					return;
				}

				return {
					...old,
					threats: old.threats.filter( threat => threat.id !== threatId ),
				};
			} );
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( old?: ScanStatus ) => {
				if ( ! old ) {
					return;
				}

				return {
					...old,
					threats: [
						...old.threats,
						{
							...previousHistory.threats.find( threat => threat.id === threatId ),
							status: 'current',
						},
					],
				};
			} );

			showSuccessNotice( __( 'Threat is no longer ignored.', 'jetpack-protect' ) );

			return { previousHistory, previousScanStatus };
		},
		onError: ( error, threatId, context ) => {
			// Roll back to the previous value
			queryClient.setQueryData( [ QUERY_HISTORY_KEY ], context.previousHistory );
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], context.previousScanStatus );

			showErrorNotice( __( 'An error occurred un-ignoring the threat.', 'jetpack-protect' ) );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
		},
	} );
}
