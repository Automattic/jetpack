import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Use Toggle WAF Mutatation
 *
 * @return {object} Mutation object
 */
export default function useToggleWafMutation() {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showSavingNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.toggleWaf,
		onMutate: () => {
			// Show a loading notice.
			showSavingNotice( __( 'Enabling the WAF module…', 'jetpack-protect' ) );
		},
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );

			// Show a success notice.
			showSuccessNotice( __( 'WAF module enabled.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'An error occurred enabling the WAF module.', 'jetpack-protect' ) );
		},
	} );
}
