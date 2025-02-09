import { ScanStatus } from '@automattic/jetpack-scan';
import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Ignore Threat Mutatation
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useIgnoreThreatMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.ignoreThreat,
		onMutate: async ( threatId: number ) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries( { queryKey: [ QUERY_HISTORY_KEY ] }, { silent: true } );
			await queryClient.cancelQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] }, { silent: true } );

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
					threats: [
						...old.threats,
						{
							...previousScanStatus.threats.find( threat => threat.id === threatId ),
							status: 'ignored',
						},
					],
				};
			} );
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], ( old?: ScanStatus ) => {
				if ( ! old ) {
					return;
				}

				return {
					...old,
					threats: old.threats.filter( threat => threat.id !== threatId ),
				};
			} );

			showSuccessNotice( __( 'Threat ignored.', 'jetpack-protect' ) );

			return { previousHistory, previousScanStatus };
		},
		onError: ( error, threatId, context ) => {
			// Roll back to the previous value
			queryClient.setQueryData( [ QUERY_HISTORY_KEY ], context.previousHistory );
			queryClient.setQueryData( [ QUERY_SCAN_STATUS_KEY ], context.previousScanStatus );

			showErrorNotice( __( 'An error occurred ignoring the threat.', 'jetpack-protect' ) );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
		},
	} );
}
