import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import camelize from 'camelize';
import API from '../../api';
import { QUERY_ACCOUNT_PROTECTION_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { AccountProtectionStatus } from '../../types/account-protection';
/**
 * Account Protection Mutatation
 *
 * @return {UseMutationResult} useMutation result.
 */
export default function useAccountProtectionMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSavingNotice, showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.updateAccountProtection,
		onMutate: config => {
			showSavingNotice();

			// Get the current cached data.
			const initialValue = queryClient.getQueryData< AccountProtectionStatus >( [
				QUERY_ACCOUNT_PROTECTION_KEY,
			] );

			// Optimistically update the `isEnabled` property.
			if ( initialValue ) {
				queryClient.setQueryData(
					[ QUERY_ACCOUNT_PROTECTION_KEY ],
					( accountProtectionStatus: AccountProtectionStatus ) => ( {
						...accountProtectionStatus,
						config: {
							...accountProtectionStatus.config,
							...camelize( config ),
						},
					} )
				);
			}

			return { initialValue };
		},
		onSuccess: ( data: AccountProtectionStatus ) => {
			showSuccessNotice( __( 'Changes saved.', 'jetpack-protect' ) );

			// Update the cached data with the latest data from the server.
			queryClient.setQueryData< AccountProtectionStatus >( [ QUERY_ACCOUNT_PROTECTION_KEY ], data );
		},
		onError: ( error, variables, context ) => {
			// If the request failed, revert the optimistic update.
			if ( context?.initialValue ) {
				queryClient.setQueryData< AccountProtectionStatus >(
					[ QUERY_ACCOUNT_PROTECTION_KEY ],
					context.initialValue
				);
			}

			// Invalidate the query to refetch the latest data from the server.
			queryClient.invalidateQueries( { queryKey: [ QUERY_ACCOUNT_PROTECTION_KEY ] } );

			showErrorNotice( __( 'An error occurred.', 'jetpack-protect' ) );
		},
	} );
}
