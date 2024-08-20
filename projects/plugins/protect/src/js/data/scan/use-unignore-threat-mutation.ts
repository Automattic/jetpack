import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Use Un-Ignore Threat Mutatation
 *
 * @return {object} Mutation object
 */
export default function useUnIgnoreThreatMutation() {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: threatId => API.unIgnoreThreat( threatId ),
		onSuccess: () => {
			// Invalidate affected queries.
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );

			// Show a success notice.
			showSuccessNotice( __( 'Threat is no longer ignored.', 'jetpack-protect' ) );
		},
		onError: () => {
			// Show an error notice.
			showErrorNotice( __( 'An error occurred un-ignoring the threat.', 'jetpack-protect' ) );
		},
	} );
}
