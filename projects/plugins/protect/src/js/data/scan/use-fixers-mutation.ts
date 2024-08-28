import { useMutation, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_FIXERS_KEY, QUERY_SCAN_STATUS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';

/**
 * Use Fixers Mutatation
 *
 * @return {object} Mutation object
 */
export default function useFixersMutation() {
	const { showSuccessNotice, showErrorNotice } = useNotices();
	const queryClient = useQueryClient();

	return useMutation( {
		mutationFn: threatIds => API.fixThreats( threatIds ),
		onMutate: ( threatIds: number[] ) => {
			// Optimistically update the fixer status to 'in_progress' for the selected threats.
			queryClient.setQueryData(
				[ QUERY_FIXERS_KEY, ...threatIds ],
				( currentFixers: { threats: [] } ) => ( {
					...currentFixers,
					threats: {
						...currentFixers.threats,
						...threatIds.reduce( ( acc, threatId ) => {
							acc[ threatId ] = { status: 'in_progress' };
							return acc;
						}, {} ),
					},
				} )
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
			showErrorNotice( __( 'An error occurred fixing threats.', 'jetpack-protect' ) );
		},
		onSettled: ( data, error, threatIds ) => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SCAN_STATUS_KEY ] } );
			queryClient.invalidateQueries( { queryKey: [ QUERY_FIXERS_KEY, ...threatIds ] } );
		},
	} );
}
