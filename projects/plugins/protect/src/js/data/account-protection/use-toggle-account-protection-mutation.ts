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
export default function useToggleAccountProtectMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showSavingNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.toggleAccountProtection,
		onMutate: () => {
			showSavingNotice();
			// Get the current account protection settings.
			const initialValue = queryClient.getQueryData( [ QUERY_ACCOUNT_PROTECTION_KEY ] );

			// Optimistically update settings.
			queryClient.setQueryData( [ QUERY_ACCOUNT_PROTECTION_KEY ], ( status: boolean ) => ! status );

			return { initialValue };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice(
				__( 'An error occurred toggling the account protection module.', 'jetpack-protect' )
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_ACCOUNT_PROTECTION_KEY ] } );
		},
	} );
}
