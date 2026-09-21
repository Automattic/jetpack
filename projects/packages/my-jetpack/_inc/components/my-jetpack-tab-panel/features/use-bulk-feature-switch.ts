import { useGlobalNotices } from '@automattic/jetpack-components';
import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { _n, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { hasPlainSwitch, requestModuleSwitch } from '../../../data/module-switch';
import { QUERY_KEY, getSwitchErrorMessage, requestPluginSwitch } from './use-main-features';
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

	// Resolves to null on success, or to what to tell the user on failure.
	const switchOne = useCallback(
		async ( { control, feature }: FeatureState, active: boolean ): Promise< string | null > => {
			const failed = getSwitchErrorMessage( undefined, feature.name );

			if ( control.kind === 'module' ) {
				const ok = await requestModuleSwitch(
					updateJetpackModuleStatus,
					control.module.module,
					active
				);
				return ok ? null : failed;
			}

			if ( control.kind !== 'plugin' ) {
				return failed;
			}

			return requestPluginSwitch(
				queryClient,
				control.plugin,
				active ? 'activate' : 'deactivate'
			).then(
				() => null,
				( error: { message?: string } ) =>
					getSwitchErrorMessage( error, feature.plugin_name || feature.name )
			);
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

			const errors = results.filter( ( error ): error is string => error !== null );
			const succeeded = targets.length - errors.length;

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

			if ( errors.length ) {
				queryClient.invalidateQueries( { queryKey: QUERY_KEY } );
				// One notice per failure, each naming what went wrong where the site said.
				errors.forEach( error => createErrorNotice( error ) );
			}
		},
		[ createErrorNotice, createSuccessNotice, invalidateResolution, queryClient, switchOne ]
	);

	return { run, isRunning };
}
