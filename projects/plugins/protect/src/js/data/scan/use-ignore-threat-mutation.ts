import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_HISTORY_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Use Ignore Threat Mutatation
 *
 * @return {object} Mutation object
 */
export default function useIgnoreThreatMutation() {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: ( threatId: number ) => API.ignoreThreat( threatId ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_HISTORY_KEY ] } );

			showSuccessNotice( __( 'Threat ignored.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'An error occurred ignoring the threat.', 'jetpack-protect' ) );
		},
	} );
}
