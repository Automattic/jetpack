import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_ACCOUNT_PROTECTION_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { AccountProtectionStatus } from '../../types/account-protection';

/**
 * Account Protection Mutatation Hook
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useAccountProtectionMutation(): UseMutationResult<
	unknown,
	{ [ key: string ]: unknown },
	unknown,
	{ initialValue: AccountProtectionStatus }
> {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showSavingNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.updateAccountProtection,
		onMutate: settings => {
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
					settings: {
						...accountProtectionStatus.settings,
						...camelize( settings ),
					},
				} )
			);

			return { initialValue };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: ( error, variables, context ) => {
			// Reset the WAF config to its previous state.
			queryClient.setQueryData( [ QUERY_ACCOUNT_PROTECTION_KEY ], context.initialValue );

			showErrorNotice( __( 'Error saving changes.', 'jetpack-protect' ) );
		},
	} );
}
