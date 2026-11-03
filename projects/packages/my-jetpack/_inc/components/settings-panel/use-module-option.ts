import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useState } from 'react';
import type { MyJetpackModule } from '../../types';

/**
 * A module's on/off option: the stored value, saved through `jetpack/v4/settings`.
 *
 * The asked-for value shows until the save settles, then the modules store is refetched.
 *
 * @param $module - The module that owns the option.
 * @param name    - The option name, such as `show_headline`.
 * @return The value to show, whether a save is running, and the setter.
 */
export function useModuleOption( $module: MyJetpackModule, name: string ) {
	const { fetchModules } = useDispatch( modulesStore );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const [ requested, setRequested ] = useState< boolean | null >( null );

	const option = Array.isArray( $module.options ) ? undefined : $module.options?.[ name ];
	const stored = Boolean( ( option as { current_value?: unknown } | undefined )?.current_value );

	const setValue = useCallback(
		async ( value: boolean ) => {
			setRequested( value );
			try {
				await apiFetch( {
					path: '/jetpack/v4/settings',
					method: 'POST',
					data: { [ name ]: value },
				} );
				await fetchModules();
				createSuccessNotice( __( 'Updated settings.', 'jetpack-my-jetpack' ), {
					type: 'snackbar',
				} );
			} catch {
				createErrorNotice( __( 'Failed to save the setting.', 'jetpack-my-jetpack' ), {
					type: 'snackbar',
				} );
			} finally {
				setRequested( null );
			}
		},
		[ name, fetchModules, createErrorNotice, createSuccessNotice ]
	);

	return { value: requested ?? stored, isSaving: requested !== null, setValue };
}
