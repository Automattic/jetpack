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
		onSuccess: ( data, threatIds ) => {
			// Optimistically update the fixer status to 'in_progress' for the selected threats.
			queryClient.setQueryData(
				[ QUERY_FIXERS_KEY ],
				(
					currentFixers:
						| { ok: boolean; threats: { [ key: number ]: { status: string } } }
						| undefined
				) => {
					if ( ! currentFixers ) {
						currentFixers = { ok: true, threats: {} };
					}

					const updatedThreats = {
						...currentFixers.threats,
						...threatIds.reduce(
							( acc, threatId ) => {
								acc[ threatId ] = { status: 'in_progress' };
								return acc;
							},
							{} as { [ key: number ]: { status: string } }
						),
					};

					const newFixers = {
						...currentFixers,
						threats: updatedThreats,
					};

					return newFixers;
				}
			);

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
