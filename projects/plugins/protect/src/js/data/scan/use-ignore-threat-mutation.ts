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
		mutationFn: async ( threatId: number ) => {
			const response = await API.ignoreThreat( threatId );

			// Refetch the scan status and history queries as a part of the mutation function.
			// This keeps the mutator in a loading state until the side effects of the mutation are handled.
			await Promise.all( [
				queryClient.refetchQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } ),
				queryClient.refetchQueries( { queryKey: [ QUERY_HISTORY_KEY ] } ),
			] );

			return response;
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Threat ignored.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'An error occurred ignoring the threat.', 'jetpack-protect' ) );
		},
	} );
}
