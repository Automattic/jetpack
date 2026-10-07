import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { saveSetting } from './api';
import { errorMessage } from './error-message';
import { MUTATION_SCOPE, SAVE_SETTING_KEY, queryKeys } from './queries';
import type { SettingKey, Settings } from '../types';

interface SettingChange {
	key: SettingKey;
	value: Settings[ SettingKey ];
	previous: Settings[ SettingKey ];
}

export type SaveSetting = < K extends SettingKey >(
	key: K,
	value: Settings[ K ]
) => Promise< Settings | undefined >;

/**
 * Save one setting optimistically, rolling it back if the server refuses.
 *
 * @return Save function, resolving to the saved settings or undefined on failure.
 */
export function useSaveSetting(): SaveSetting {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const { mutateAsync } = useMutation( {
		mutationKey: SAVE_SETTING_KEY,
		scope: MUTATION_SCOPE,
		mutationFn: ( { key, value }: SettingChange ) => saveSetting( key, value ),
		onSuccess: saved => {
			// Each response carries every setting, so one landing while another save waits would undo that save's value.
			if ( queryClient.isMutating( { mutationKey: SAVE_SETTING_KEY } ) <= 1 ) {
				queryClient.setQueryData( queryKeys.settings, saved );
			}
			createSuccessNotice( __( 'Settings have been saved', 'jetpack-sharing-likes' ), {
				type: 'snackbar',
			} );
		},
		onError: ( error, { key, previous } ) => {
			queryClient.setQueryData< Settings >(
				queryKeys.settings,
				current => current && { ...current, [ key ]: previous }
			);
			createErrorNotice(
				errorMessage( error, __( 'Your settings could not be saved.', 'jetpack-sharing-likes' ) ),
				{ type: 'snackbar' }
			);
			// A refused save usually means the screen is out of date: another tab, or a host forcing a module.
			queryClient.invalidateQueries( { queryKey: queryKeys.settings } );
		},
		// Saving Comment Likes can change which sections configure, and so which settings are offered.
		onSettled: () => queryClient.invalidateQueries( { queryKey: queryKeys.status } ),
	} );

	return useCallback(
		( key: SettingKey, value: Settings[ SettingKey ] ) => {
			const previous = queryClient.getQueryData< Settings >( queryKeys.settings )?.[ key ];
			queryClient.setQueryData< Settings >( queryKeys.settings, current => ( {
				...current,
				[ key ]: value,
			} ) );
			return mutateAsync( { key, value, previous } ).catch( () => undefined );
		},
		[ mutateAsync, queryClient ]
	) as SaveSetting;
}
