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

			// Get the current cached data
			const previousData = queryClient.getQueryData< AccountProtectionStatus >( [
				QUERY_ACCOUNT_PROTECTION_KEY,
			] );

			// Optimistically update the `isEnabled` property
			if ( previousData ) {
				queryClient.setQueryData< AccountProtectionStatus >( [ QUERY_ACCOUNT_PROTECTION_KEY ], {
					...previousData,
					isEnabled: ! previousData.isEnabled,
				} );
			}

			return { previousData };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );
		},
		onError: ( error, variables, context ) => {
			// If the request failed, revert the optimistic update.
			if ( context?.previousData ) {
				queryClient.setQueryData< AccountProtectionStatus >(
					[ QUERY_ACCOUNT_PROTECTION_KEY ],
					context.previousData
				);
			}

			showErrorNotice( __( 'An error occurred.', 'jetpack-protect' ) );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_ACCOUNT_PROTECTION_KEY ] } );
		},
	} );
}
