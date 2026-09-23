import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import {
	useIsMutating,
	useMutation,
	useMutationState,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { queueActivationRequest } from '../../../data/queue-activation-request';
import {
	clearRequestedSwitch,
	pluginSwitchKey,
	setRequestedSwitch,
	useRequestedSwitch,
} from '../../../data/requested-switch-state';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { setPendingSuccessNotice } from '../products/pending-notice';
import { reloadPage } from '../products/reload-page';
import type { QueryClient } from '@tanstack/react-query';

export const QUERY_KEY = [ 'my-jetpack-main-features' ];

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
	const { data, isError } = useQuery( {
		queryKey: QUERY_KEY,
		queryFn: () => apiFetch< MainFeaturesState >( { path: '/wpcom/v2/my-jetpack/site/features' } ),
		// The page's own copy renders the grid immediately; it is never cached, so a remount
		// reads the site again rather than restoring a snapshot the site has moved past.
		// Something switched elsewhere — the Products tab, the Plugins screen — is picked up
		// on the next mount rather than only on a full page load.
		placeholderData: initialState,
		staleTime: 30_000,
	} );

	// A failed read drops the placeholder, which would empty the grid and read as "this
	// site has no features". The page's own copy is stale but it is not nothing.
	return data ?? ( isError ? initialState() : EMPTY_STATE );
}

/**
 * The key every action on one plugin runs under, so the card and the modal share its progress and errors.
 *
 * @param plugin - The plugin's WordPress.org slug, or `jetpack`.
 * @return The mutation key.
 */
const pluginMutationKey = ( plugin: string ) => [ 'my-jetpack-feature-plugin', plugin ];

/**
 * Send one plugin action through the activation queue, holding the asked-for value meanwhile.
 *
 * The response carries the whole site, so it is written straight to the Features tab's state.
 * An install holds no value: it takes seconds and can fail, so the card says "Installing…"
 * rather than showing the feature on before it is there.
 *
 * @param queryClient - The query client holding that state.
 * @param plugin      - The plugin's WordPress.org slug, or `jetpack`.
 * @param action      - What to do with it.
 * @return The site's features after the action; rejects with the server's error.
 */
function requestPluginSwitch(
	queryClient: QueryClient,
	plugin: string,
	action: PluginAction
): Promise< MainFeaturesState > {
	const key = pluginSwitchKey( plugin );
	const token = action === 'install' ? null : setRequestedSwitch( key, action !== 'deactivate' );

	return queueActivationRequest( () =>
		apiFetch< MainFeaturesState >( {
			path: '/wpcom/v2/my-jetpack/site/features/plugin',
			method: 'POST',
			data: { plugin, action },
		} )
	)
		.then( state => {
			queryClient.setQueryData( QUERY_KEY, state );
			return state;
		} )
		.finally( () => {
			if ( token !== null ) {
				clearRequestedSwitch( key, token );
			}
		} );
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

	const mutationKey = pluginMutationKey( plugin );
	const { mutate } = useMutation( {
		mutationKey,
		mutationFn: async ( action: PluginAction ) => {
			// A read already in flight would land after this request and overwrite what it
			// returns, with the asked-for value already cleared and nothing left to mask it.
			await queryClient.cancelQueries( { queryKey: QUERY_KEY } );
			return requestPluginSwitch( queryClient, plugin, action );
		},
		onSuccess: ( _state, action ) => {
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
		onError: ( error: { message?: string }, action ) => {
			// Read the site again: the plugin may well have been switched before whatever failed.
			queryClient.invalidateQueries( { queryKey: QUERY_KEY } );
			invalidateResolution( 'getJetpackModules', [] );

			// Shown on the feature itself instead (see useInstallError).
			if ( action === 'install' ) {
				return;
			}

			// The route hands back what actually failed; a generic "try again" just invites the same click.
			createErrorNotice(
				error?.message ||
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
	// The asked-for value also covers a bulk switch, which skips this mutation.
	const isAsked = useRequestedSwitch( pluginSwitchKey( plugin ) ) !== null;
	const isBusy = useIsMutating( { mutationKey } ) > 0 || isAsked;
	const run = useCallback( ( action: PluginAction ) => mutate( action ), [ mutate ] );

	return { run, isBusy };
}

/**
 * Why the last install of a plugin failed, until it is tried again.
 *
 * @param plugin - The plugin's WordPress.org slug, or `jetpack`.
 * @return The server's message, or null when the last attempt did not fail.
 */
export function useInstallError( plugin: string ): string | null {
	const attempts = useMutationState( {
		filters: { mutationKey: pluginMutationKey( plugin ) },
		select: mutation => mutation.state,
	} );
	const last = attempts[ attempts.length - 1 ];

	if ( last?.status !== 'error' || last.variables !== 'install' ) {
		return null;
	}

	return (
		( last.error as { message?: string } | null )?.message ||
		__( 'The plugin could not be installed. Please try again.', 'jetpack-my-jetpack' )
	);
}
