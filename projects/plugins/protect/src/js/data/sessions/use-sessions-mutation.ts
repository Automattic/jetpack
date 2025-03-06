import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_SESSIONS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { SessionsStatus } from '../../types/sessions';

/**
 * Sessions Mutatation Hook
 *
 * @return {UseMutationResult} Mutation result.
 */
export default function useSessionsMutation(): UseMutationResult {
	const queryClient = useQueryClient();
	const { showSuccessNotice, showErrorNotice } = useNotices();

	return useMutation( {
		mutationFn: API.terminateSessions,
		onMutate: async ( sessions: SessionsStatus[] ) => {
			const previousData = queryClient.getQueryData( [ QUERY_SESSIONS_KEY ] );

			queryClient.setQueryData( [ QUERY_SESSIONS_KEY ], ( currentSessions: SessionsStatus[] ) => {
				return currentSessions.filter( session => ! sessions.includes( session ) );
			} );

			return { previousData };
		},
		onSuccess: () => {
			showSuccessNotice( __( 'Sessions terminated.', 'jetpack-protect' ) );
		},
		onError: () => {
			showErrorNotice( __( 'An error occurred terminating sessions.', 'jetpack-protect' ) );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey: [ QUERY_SESSIONS_KEY ] } );
		},
	} );
}
