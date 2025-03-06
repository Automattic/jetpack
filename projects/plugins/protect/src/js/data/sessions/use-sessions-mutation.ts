import { useMutation, type UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import API from '../../api';
import { QUERY_SESSIONS_KEY } from '../../constants';
import useNotices from '../../hooks/use-notices';
import { SessionsStatus, UserSessionTokens } from '../../types/sessions';

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
		onMutate: async ( userSessionTokens: UserSessionTokens[] ) => {
			const previousData = queryClient.getQueryData< SessionsStatus[] >( [ QUERY_SESSIONS_KEY ] );

			const tokenSet = new Set( userSessionTokens.flatMap( ( { tokens } ) => tokens ) );

			queryClient.setQueryData( [ QUERY_SESSIONS_KEY ], ( sessions: SessionsStatus[] = [] ) =>
				sessions.filter( session => ! tokenSet.has( session.token ) )
			);

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
