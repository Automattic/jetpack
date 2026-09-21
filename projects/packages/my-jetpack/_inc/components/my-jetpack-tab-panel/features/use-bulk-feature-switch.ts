import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { hasPlainSwitch } from '../../../data/module-switch';
import { queueActivationRequest } from '../../../data/queue-activation-request';
import {
	clearRequestedSwitch,
	moduleSwitchKey,
	pluginSwitchKey,
	setRequestedSwitch,
} from '../../../data/requested-switch-state';
import { QUERY_KEY } from './use-main-features';
import type { FeatureState } from './feature-state';

type BulkFailure = { type: 'module' | 'plugin'; slug: string; message: string };

type BulkResponse = { state: MainFeaturesState; failed: BulkFailure[] };

/**
 * Whether a feature's switch can be flipped as part of a bulk action.
 *
 * Only the plain switches qualify: installs, and modules whose card offers something
 * other than a switch, need the feature's own control.
 *
 * @param state - The feature's live state.
 * @return Whether the feature can be switched in bulk.
 */
export function isBulkSwitchable( state: FeatureState ): boolean {
	if ( state.pending || state.isSwitching ) {
		return false;
	}

	const { control } = state;

	if ( control.kind === 'module' ) {
		return hasPlainSwitch( control.module );
	}

	return control.kind === 'plugin';
}

/**
 * What a feature is switched by, as the bulk route names it.
 *
 * @param state - The feature's live state.
 * @return The kind of switch and its slug.
 */
function getSwitch( state: FeatureState ): { type: 'module' | 'plugin'; slug: string } {
	const { control } = state;

	return control.kind === 'module'
		? { type: 'module', slug: control.module.module }
		: { type: 'plugin', slug: control.kind === 'plugin' ? control.plugin : '' };
}

/**
 * Switch many features on or off at once, in one request, with one notice for the lot.
 *
 * @return The handler, and whether a bulk switch is running.
 */
export function useBulkFeatureSwitch() {
	const queryClient = useQueryClient();
	const { fetchModules } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const [ isRunning, setIsRunning ] = useState( false );

	const run = useCallback(
		async ( states: FeatureState[], active: boolean ) => {
			const targets = states.filter(
				state => isBulkSwitchable( state ) && ( state.status === 'active' ) !== active
			);

			if ( ! targets.length ) {
				return;
			}

			const switches = targets.map( getSwitch );
			const slugsOf = ( type: BulkFailure[ 'type' ] ) =>
				switches.filter( item => item.type === type ).map( item => item.slug );

			// Every row takes the asked-for value at once, and keeps it until the whole batch
			// has landed, so the batch reads as one change rather than one feature at a time.
			const held = switches.map( ( { type, slug } ) => {
				const key = type === 'module' ? moduleSwitchKey( slug ) : pluginSwitchKey( slug );
				return { key, token: setRequestedSwitch( key, active ) };
			} );

			setIsRunning( true );

			try {
				// A read already in flight would land after this request and undo what it returns.
				await queryClient.cancelQueries( { queryKey: QUERY_KEY } );

				const { state, failed } = await queueActivationRequest( () =>
					apiFetch< BulkResponse >( {
						path: '/wpcom/v2/my-jetpack/site/features/bulk',
						method: 'POST',
						data: { active, modules: slugsOf( 'module' ), plugins: slugsOf( 'plugin' ) },
					} )
				);

				queryClient.setQueryData( QUERY_KEY, state );
				// Modules are read from their own store, which has to catch up before the rows
				// let go of the asked-for value, or they flicker back to the old one first.
				await fetchModules();

				const succeeded = targets.length - failed.length;

				if ( succeeded ) {
					const activated = sprintf(
						/* translators: %d is how many features were switched on. */
						_n(
							'%d feature activated.',
							'%d features activated.',
							succeeded,
							'jetpack-my-jetpack'
						),
						succeeded
					);
					const deactivated = sprintf(
						/* translators: %d is how many features were switched off. */
						_n(
							'%d feature deactivated.',
							'%d features deactivated.',
							succeeded,
							'jetpack-my-jetpack'
						),
						succeeded
					);
					createSuccessNotice( active ? activated : deactivated );
				}

				failed.forEach( ( { type, slug, message } ) => {
					const index = switches.findIndex( item => item.type === type && item.slug === slug );

					createErrorNotice(
						sprintf(
							/* translators: %1$s is a feature name, %2$s is why it could not be changed. */
							__( '%1$s: %2$s', 'jetpack-my-jetpack' ),
							targets[ index ]?.feature.name ?? slug,
							message
						)
					);
				} );
			} catch ( error ) {
				// The request as a whole failed, so the site may have switched some, all or none.
				queryClient.invalidateQueries( { queryKey: QUERY_KEY } );
				await fetchModules();
				createErrorNotice(
					( error as { message?: string } )?.message ||
						__( 'Could not change the selected features. Please try again.', 'jetpack-my-jetpack' )
				);
			} finally {
				held.forEach( ( { key, token } ) => clearRequestedSwitch( key, token ) );
				setIsRunning( false );
			}
		},
		[ createErrorNotice, createSuccessNotice, fetchModules, queryClient ]
	);

	return { run, isRunning };
}
