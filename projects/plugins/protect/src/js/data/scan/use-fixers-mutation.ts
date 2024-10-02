import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_FIXERS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

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
		onSuccess: data => {
			// Handle a top level error
			if ( data.ok === false ) {
				throw new Error( data.error );
			}

			const isThreatLevelError = Object.values( data.threats ).every( threat => 'error' in threat );

			// Handle a threat level error
			if ( isThreatLevelError ) {
				throw new Error();
			}

			// The data returned from the API is the same as the data we need to update the cache.
			queryClient.setQueryData( [ QUERY_FIXERS_KEY ], data );

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
