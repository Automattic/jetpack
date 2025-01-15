import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_ACCOUNT_PROTECTION_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { AccountProtectionStatus } from '../../types/account-protection';

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

			// Get the current Account Protection settings.
			const initialValue = queryClient.getQueryData( [
				QUERY_ACCOUNT_PROTECTION_KEY,
			] ) as AccountProtectionStatus;

			// Optimistically update the Account Protection settings.
			queryClient.setQueryData(
				[ QUERY_ACCOUNT_PROTECTION_KEY ],
				( accountProtectionStatus: AccountProtectionStatus ) => ( {
					...accountProtectionStatus,
					isEnabled: ! initialValue.isEnabled,
				} )
			);

			return { initialValue };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'Error savings changes.', 'jetpack-protect' ) );
		},
	} );
}
