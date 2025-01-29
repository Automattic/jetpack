import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_ACCOUNT_PROTECTION_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Toggle Account Protection Mutatation
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useToggleAccountProtectionMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSavingNotice, showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.toggleAccountProtection,
		onMutate: () => {
			showSavingNotice();

			const initialValue = queryClient.getQueryData( [ QUERY_ACCOUNT_PROTECTION_KEY ] );

			queryClient.setQueryData( [ QUERY_ACCOUNT_PROTECTION_KEY ], ! initialValue );

			return { initialValue };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'An error occurred.', 'jetpack-protect' ) );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_ACCOUNT_PROTECTION_KEY ] } );
		},
	} );
}
