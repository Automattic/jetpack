import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { configures, type Feature, type Status } from '../types';
import { runFeatureAction, type FeatureAction } from './api';
import { errorMessage } from './error-message';
import { FEATURE_ACTION_KEY, MUTATION_SCOPE, SAVE_SETTING_KEY, queryKeys } from './queries';
import type { QueryClient } from '@tanstack/react-query';

export type { FeatureAction };

/**
 * Whether the cached status has the Sharing section showing its options.
 *
 * @param queryClient - Query client.
 * @return Whether it configures.
 */
function sharingConfigures( queryClient: QueryClient ): boolean {
	const state = queryClient.getQueryData< Status >( queryKeys.status )?.sharing.state;
	return !! state && configures( state );
}

/**
 * "Switch to the … block" and "Turn on …".
 *
 * @return Run function, and whether this instance's action is in flight.
 */
export function useFeatureAction() {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const { mutate, isPending } = useMutation( {
		mutationKey: FEATURE_ACTION_KEY,
		scope: MUTATION_SCOPE,
		mutationFn: ( { feature, action }: { feature: Feature; action: FeatureAction } ) =>
			runFeatureAction( feature, action ),
		onSuccess: status => {
			queryClient.setQueryData( queryKeys.status, status );
			createSuccessNotice( __( 'Settings have been saved', 'jetpack-sharing-likes' ), {
				type: 'snackbar',
			} );
		},
		onError: error => {
			createErrorNotice(
				errorMessage(
					error,
					__( 'This action is not available on this site right now.', 'jetpack-sharing-likes' )
				),
				{ type: 'snackbar' }
			);
		},
		// Which settings are offered follows the section variants; returned so the reads finish inside the scope.
		onSettled: ( _status, error ) =>
			Promise.all( [
				error ? queryClient.invalidateQueries( { queryKey: queryKeys.status } ) : undefined,
				// A pending save's response brings fresh settings, and this read could land after it.
				queryClient.isMutating( { mutationKey: SAVE_SETTING_KEY } ) > 0
					? undefined
					: queryClient.invalidateQueries( { queryKey: queryKeys.settings } ),
				// The list is still mounted until React re-renders, and the route answers 409 once Sharing stops configuring.
				queryClient.invalidateQueries( {
					queryKey: queryKeys.services,
					refetchType: ! error && sharingConfigures( queryClient ) ? 'active' : 'none',
				} ),
			] ),
	} );

	const run = useCallback(
		( feature: Feature, action: FeatureAction ) => mutate( { feature, action } ),
		[ mutate ]
	);

	return { run, isPending };
}
