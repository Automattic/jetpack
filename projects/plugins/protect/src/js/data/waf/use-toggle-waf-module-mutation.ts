import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_WAF_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Toggle WAF Mutatation
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useToggleWafMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.toggleWaf,
		onSuccess: () => {
			showSuccessNotice( __( 'WAF module enabled.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'An error occurred enabling the WAF module.', 'jetpack-protect' ) );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_WAF_KEY ] } );
		},
	} );
}
