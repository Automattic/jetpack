import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { runFeatureAction, type FeatureAction } from './api';
import { errorMessage } from './error-message';
import { FEATURE_ACTION_KEY, MUTATION_SCOPE, SAVE_SETTING_KEY, queryKeys } from './queries';
import type { Feature } from '../types';

export type { FeatureAction };

/**
 * "Switch to the … block" and "Turn on …".
 *
 * @return Run function, and whether this instance's action is in flight.
 */
export function useFeatureAction() {
	const queryClient = useQueryClient();
	const { createErrorNotice } = useDispatch( noticesStore );

	const { mutate, isPending } = useMutation( {
		mutationKey: FEATURE_ACTION_KEY,
		scope: MUTATION_SCOPE,
		mutationFn: ( { feature, action }: { feature: Feature; action: FeatureAction } ) =>
			runFeatureAction( feature, action ),
		onSuccess: status => queryClient.setQueryData( queryKeys.status, status ),
		onError: error => {
			createErrorNotice(
				errorMessage(
					error,
					__( 'This action is not available on this site right now.', 'jetpack-sharing-likes' )
				),
				{ type: 'snackbar' }
			);
			queryClient.invalidateQueries( { queryKey: queryKeys.status } );
		},
		// Which settings are offered follows the section variants; returned so the reads finish inside the scope.
		onSettled: () =>
			Promise.all( [
				// A pending save's response brings fresh settings, and this read could land after it.
				queryClient.isMutating( { mutationKey: SAVE_SETTING_KEY } ) > 0
					? undefined
					: queryClient.invalidateQueries( { queryKey: queryKeys.settings } ),
				queryClient.invalidateQueries( { queryKey: queryKeys.services } ),
			] ),
	} );

	const run = useCallback(
		( feature: Feature, action: FeatureAction ) => mutate( { feature, action } ),
		[ mutate ]
	);

	return { run, isPending };
}
