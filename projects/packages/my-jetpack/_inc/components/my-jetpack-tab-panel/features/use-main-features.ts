import { useGlobalNotices } from '@automattic/jetpack-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { queueActivationRequest } from '../../module-toggle';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';

const QUERY_KEY = [ 'my-jetpack-main-features' ];

const EMPTY_STATE: MainFeaturesState = { jetpack: 'not-installed', features: [] };

export type PluginAction = 'install' | 'activate' | 'deactivate';

/**
 * The Features tab's state: the Jetpack plugin's status and each feature.
 *
 * Seeded from the page and replaced wholesale by each plugin action's response, so it is
 * never fetched on its own.
 *
 * @return The state.
 */
export function useMainFeatures(): MainFeaturesState {
	const { data } = useQuery( {
		queryKey: QUERY_KEY,
		queryFn: () => getMyJetpackWindowInitialState( 'mainFeatures' ) ?? EMPTY_STATE,
		initialData: () => getMyJetpackWindowInitialState( 'mainFeatures' ) ?? EMPTY_STATE,
		staleTime: Infinity,
	} );

	return data;
}

/**
 * Install, activate or deactivate a plugin from the feature map.
 *
 * @param plugin - The plugin's WordPress.org slug, or `jetpack`.
 * @param name   - What to call it in the notice.
 * @return The handler and whether a request is in flight.
 */
export function useFeaturePlugin( plugin: string, name: string ) {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	const { mutate, isPending } = useMutation( {
		mutationFn: ( action: PluginAction ) =>
			queueActivationRequest( () =>
				apiFetch< MainFeaturesState >( {
					path: '/my-jetpack/v1/site/features/plugin',
					method: 'POST',
					data: { plugin, action },
				} )
			),
		onSuccess: ( state, action ) => {
			queryClient.setQueryData( QUERY_KEY, state );

			// Bound before the branch, for the reason given in feature-modal-actions.tsx.
			const deactivated = sprintf(
				/* translators: %s is a plugin or feature name. */
				__( '%s deactivated.', 'jetpack-my-jetpack' ),
				name
			);
			const activated = sprintf(
				/* translators: %s is a plugin or feature name. */
				__( '%s is on.', 'jetpack-my-jetpack' ),
				name
			);
			const message = action === 'deactivate' ? deactivated : activated;

			// Jetpack's modules only load on the next request, so the page has to reload to
			// offer them; everything else updates in place.
			if ( plugin === 'jetpack' ) {
				setPendingSuccessNotice( message );
				reloadPage();
				return;
			}

			createSuccessNotice( message );
		},
		onError: () => {
			createErrorNotice(
				sprintf(
					/* translators: %s is a plugin or feature name. */
					__( 'Could not change %s. Please try again.', 'jetpack-my-jetpack' ),
					name
				)
			);
		},
	} );

	const run = useCallback( ( action: PluginAction ) => mutate( action ), [ mutate ] );

	return { run, isBusy: isPending };
}
