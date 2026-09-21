import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { queueActivationRequest } from '../../../data/queue-activation-request';
import { pluginSwitchKey, setRequestedSwitch } from '../../../data/requested-switch-state';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';

const QUERY_KEY = [ 'my-jetpack-main-features' ];

const EMPTY_STATE: MainFeaturesState = { jetpack: 'not-installed', features: [] };

/**
 * The state the page was rendered with, or an empty one.
 *
 * `getMyJetpackWindowInitialState()` answers `{}` for a key it does not have, which a
 * plugin carrying an older copy of this package would hand us.
 *
 * @return The state.
 */
function initialState(): MainFeaturesState {
	const state = getMyJetpackWindowInitialState( 'mainFeatures' );

	return state && Array.isArray( state.features ) ? state : EMPTY_STATE;
}

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
		queryFn: () => apiFetch< MainFeaturesState >( { path: '/wpcom/v2/my-jetpack/site/features' } ),
		// The page's own copy renders the grid immediately; it is never cached, so a remount
		// reads the site again rather than restoring a snapshot the site has moved past.
		placeholderData: initialState,
		staleTime: Infinity,
	} );

	return data ?? EMPTY_STATE;
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
	const { invalidateResolution } = useDispatch( modulesStore );

	const mutationKey = [ 'my-jetpack-feature-plugin', plugin ];
	const { mutate } = useMutation( {
		mutationKey,
		mutationFn: ( action: PluginAction ) =>
			queueActivationRequest( () =>
				apiFetch< MainFeaturesState >( {
					path: '/wpcom/v2/my-jetpack/site/features/plugin',
					method: 'POST',
					data: { plugin, action },
				} )
			),
		// Record what the click asked for. Kept outside the cached state on purpose: a
		// response carries the whole site, so writing it here would let one feature's
		// response overwrite another that is still being toggled.
		onMutate: ( action: PluginAction ) => {
			setRequestedSwitch( pluginSwitchKey( plugin ), action !== 'deactivate' );
		},
		onSuccess: ( state, action ) => {
			// This request has answered, so its feature settles on what the site reports.
			setRequestedSwitch( pluginSwitchKey( plugin ), null );
			queryClient.setQueryData( QUERY_KEY, state );

			// A product switches its Jetpack module along with its plugin, so the modules
			// store the Products tab reads from is now behind.
			invalidateResolution( 'getJetpackModules', [] );

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
			// Drop the asked-for value, so the feature shows what the site last reported,
			// and read the site again: the plugin may well have been switched before
			// whatever failed.
			setRequestedSwitch( pluginSwitchKey( plugin ), null );
			queryClient.invalidateQueries( { queryKey: QUERY_KEY } );
			invalidateResolution( 'getJetpackModules', [] );

			createErrorNotice(
				sprintf(
					/* translators: %s is a plugin or feature name. */
					__( 'Could not change %s. Please try again.', 'jetpack-my-jetpack' ),
					name
				)
			);
		},
	} );

	// Keyed by plugin rather than by component: the card's switch and the modal's button
	// are two mounts of the same action, and both have to look busy while either runs.
	const isBusy = useIsMutating( { mutationKey } ) > 0;
	const run = useCallback( ( action: PluginAction ) => mutate( action ), [ mutate ] );

	return { run, isBusy };
}
