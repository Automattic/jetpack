import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useRef, useState } from 'react';
import type { MyJetpackModule } from '../../types';

/**
 * A module's text option, saved through `jetpack/v4/settings` one save at a time.
 *
 * @param $module - The module that owns the option.
 * @param name    - The option name, such as `highlander_comment_form_prompt`.
 * @return The value to show (the asked-for one until its save settles), whether a save is running, and the saver, which resolves to whether the save worked.
 */
export function useModuleTextSetting( $module: MyJetpackModule, name: string ) {
	const { fetchModules } = useDispatch( modulesStore );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const [ pending, setPending ] = useState< string | null >( null );
	const queue = useRef< Promise< unknown > >( Promise.resolve() );

	const option = Array.isArray( $module.options ) ? undefined : $module.options?.[ name ];
	const stored = String(
		( option as { current_value?: unknown } | undefined )?.current_value ?? ''
	);

	const send = useCallback(
		async ( value: string ) => {
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
				return true;
			} catch {
				createErrorNotice( __( 'Failed to save the setting.', 'jetpack-my-jetpack' ), {
					type: 'snackbar',
				} );
				return false;
			} finally {
				// A later save keeps its own pending value.
				setPending( current => ( current === value ? null : current ) );
			}
		},
		[ name, fetchModules, createErrorNotice, createSuccessNotice ]
	);

	const save = useCallback(
		( value: string ) => {
			setPending( value );
			const result = queue.current.then( () => send( value ) );
			queue.current = result;
			return result;
		},
		[ send ]
	);

	return { value: pending ?? stored, isSaving: pending !== null, save };
}
