import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useState } from 'react';
import { useSettingsPanelTracking } from './use-settings-panel-tracking';
import type { MyJetpackModule } from '../../types';

type ModuleOptionValue = boolean | string;

/**
 * A module's option: the stored value, saved through `jetpack/v4/settings`.
 *
 * The asked-for value shows until the save settles, then the modules store is refetched.
 *
 * @param $module - The module that owns the option.
 * @param name    - The option name, such as `carousel_background_color`.
 * @param parse   - Turns the stored `current_value` into the value to show.
 * @return The value to show, whether a save is running, and the setter.
 */
export function useModuleSetting< T extends ModuleOptionValue >(
	$module: MyJetpackModule,
	name: string,
	parse: ( stored: unknown ) => T
) {
	const { fetchModules } = useDispatch( modulesStore );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const [ requested, setRequested ] = useState< T | null >( null );

	const option = Array.isArray( $module.options ) ? undefined : $module.options?.[ name ];
	const stored = parse( ( option as { current_value?: unknown } | undefined )?.current_value );

	const setValue = useCallback(
		async ( value: T ) => {
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

/**
 * A module's on/off option. See `useModuleSetting()`.
 *
 * @param $module - The module that owns the option.
 * @param name    - The option name, such as `show_headline`.
 * @return The value to show, whether a save is running, and the setter.
 */
export function useModuleOption( $module: MyJetpackModule, name: string ) {
	const setting = useModuleSetting( $module, name, Boolean );
	const { trackSettingToggle } = useSettingsPanelTracking( $module.module );
	const { setValue } = setting;

	const setAndTrack = useCallback(
		( value: boolean ) => {
			trackSettingToggle( name, value );
			return setValue( value );
		},
		[ name, setValue, trackSettingToggle ]
	);

	return { ...setting, setValue: setAndTrack };
}
