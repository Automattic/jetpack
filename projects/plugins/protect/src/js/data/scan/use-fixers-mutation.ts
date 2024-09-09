import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_FIXERS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { FixersStatus } from '../../types/fixers';

/**
 * Fixers Mutatation Hook
 *
 * @return {UseMutationResult} Mutation result.
 */
export default function useFixersMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.fixThreats,
		onSuccess: async ( data, threatIds ) => {
			// Get the current cached data for threats
			const cachedData = queryClient.getQueryData( [ QUERY_FIXERS_KEY ] ) as
				| FixersStatus
				| undefined;

			// Optimistically update the fixer status to 'in_progress' for the selected threats.
			if ( cachedData && cachedData.threats ) {
				// Create a copy of the threats data
				const updatedData = { ...cachedData.threats };

				threatIds.forEach( id => {
					if ( updatedData[ id ] ) {
						updatedData[ id ] = {
							...updatedData[ id ],
							status: 'in_progress',
						};
					}
				} );

				// Set the updated data back in the cache
				queryClient.setQueryData( [ QUERY_FIXERS_KEY ], {
					...cachedData,
					threats: updatedData, // Replace the threats with the updated version
				} );
			}

			// Show a success notice.
			showSuccessNotice(
				__(
					"We're hard at work fixing this threat in the background. Please check back shortly.",
					'jetpack-protect'
				)
			);
		},
		onError: () => {
			// Show an error notice.
			showErrorNotice( __( 'An error occurred fixing threats.', 'jetpack-protect' ) );
		},
	} );
}
