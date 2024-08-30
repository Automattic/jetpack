import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_FIXERS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Fixers Mutatation Hook
 *
 * @return {unknown} Mutation object
 */
export default function useFixersMutation() {
	const { showSuccessNotice, showErrorNotice } = useNotices();
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: ( threatIds: number[] ) => API.fixThreats( threatIds ),
		// onSuccess: ( data, threatIds ) => {
		// 	// Optimistically update the fixer status to 'in_progress' for the selected threats.
		// 	queryClient.setQueryData(
		// 		[ QUERY_FIXERS_KEY ],
		// 		(
		// 			currentFixers:
		// 				| { ok: boolean; threats: { [ key: number ]: { status: string } } }
		// 				| undefined
		// 		) => {
		// 			if ( ! currentFixers ) {
		// 				currentFixers = { ok: true, threats: {} };
		// 			}

		// 			const updatedThreats = {
		// 				...currentFixers.threats,
		// 				...threatIds.reduce(
		// 					( acc, threatId ) => {
		// 						acc[ threatId ] = { status: 'in_progress' };
		// 						return acc;
		// 					},
		// 					{} as { [ key: number ]: { status: string } }
		// 				),
		// 			};

		// 			const newFixers = {
		// 				...currentFixers,
		// 				threats: updatedThreats,
		// 			};

		// 			return newFixers;
		// 		}
		// 	);

		// TODO: Test if this works for settings optimistically...
		onSuccess: data => {
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
