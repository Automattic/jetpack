import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import {
	clearRequestedSwitch,
	pluginSwitchKey,
	setRequestedSwitch,
} from '../../../data/requested-switch-state';
import { hasPlainSwitch, requestModuleSwitch } from '../../module-toggle';
import { QUERY_KEY, postFeaturePlugin } from './use-main-features';
import type { FeatureState } from './feature-state';

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
 * Switch many features on or off at once, with one notice for the lot.
 *
 * @return The handler, and whether a bulk switch is running.
 */
export function useBulkFeatureSwitch() {
	const queryClient = useQueryClient();
	const { updateJetpackModuleStatus, invalidateResolution } = useDispatch( modulesStore );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const [ isRunning, setIsRunning ] = useState( false );

	const switchOne = useCallback(
		( { control }: FeatureState, active: boolean ): Promise< boolean > => {
			if ( control.kind === 'module' ) {
				return requestModuleSwitch( updateJetpackModuleStatus, control.module.module, active );
			}

			if ( control.kind !== 'plugin' ) {
				return Promise.resolve( false );
			}

			const key = pluginSwitchKey( control.plugin );
			const token = setRequestedSwitch( key, active );

			return postFeaturePlugin( control.plugin, active ? 'activate' : 'deactivate' )
				.then(
					next => {
						queryClient.setQueryData( QUERY_KEY, next );
						return true;
					},
					() => false
				)
				.finally( () => clearRequestedSwitch( key, token ) );
		},
		[ queryClient, updateJetpackModuleStatus ]
	);

	const run = useCallback(
		async ( states: FeatureState[], active: boolean ) => {
			const targets = states.filter(
				state => isBulkSwitchable( state ) && ( state.status === 'active' ) !== active
			);

			if ( ! targets.length ) {
				return;
			}

			setIsRunning( true );
			// A read already in flight would land after these requests and undo what they return.
			await queryClient.cancelQueries( { queryKey: QUERY_KEY } );

			const results = await Promise.all( targets.map( state => switchOne( state, active ) ) );

			// Plugins switch their product's module along with them.
			invalidateResolution( 'getJetpackModules', [] );
			setIsRunning( false );

			const failed = targets.filter( ( _state, index ) => ! results[ index ] );
			const succeeded = targets.length - failed.length;

			if ( succeeded ) {
				const activated = sprintf(
					/* translators: %d is how many features were switched on. */
					_n( '%d feature activated.', '%d features activated.', succeeded, 'jetpack-my-jetpack' ),
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

			if ( failed.length ) {
				queryClient.invalidateQueries( { queryKey: QUERY_KEY } );
				createErrorNotice(
					sprintf(
						/* translators: %s is a comma-separated list of feature names. */
						__( 'Could not change: %s. Please try again.', 'jetpack-my-jetpack' ),
						failed.map( state => state.feature.name ).join( ', ' )
					)
				);
			}
		},
		[ createErrorNotice, createSuccessNotice, invalidateResolution, queryClient, switchOne ]
	);

	return { run, isRunning };
}
