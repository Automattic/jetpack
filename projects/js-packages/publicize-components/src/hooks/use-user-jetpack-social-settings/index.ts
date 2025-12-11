import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import type { UserJetpackSocialSettings, UserJetpackSocialSettingsHook } from './types';

/**
 * Hook to manage Jetpack Social user settings.
 *
 * @return UserJetpackSocialSettingsHook
 */
export function useJetpackSocialSettings(): UserJetpackSocialSettingsHook {
	const { settings, userId, currentUser, isLoading, isSaving } = useSelect( select => {
		const store = select( coreStore );
		const user = store.getCurrentUser();

		return {
			userId: user?.id,
			currentUser: user,
			settings: user?.meta?.jetpack_social,
			isLoading: ! store.hasFinishedResolution( 'getCurrentUser' ),
			isSaving: user?.id ? store.isSavingEntityRecord( 'root', 'user', user.id ) : false,
		};
	}, [] );

	const { saveUser, receiveCurrentUser } = useDispatch( coreStore );

	const updateSettings = useCallback(
		async ( newSettings: Partial< UserJetpackSocialSettings > ): Promise< void > => {
			if ( ! userId || ! currentUser ) {
				return;
			}

			const updatedSettings = {
				...settings,
				...newSettings,
			};

			// Optimistic update
			receiveCurrentUser( {
				...currentUser,
				meta: {
					...currentUser.meta,
					jetpack_social: updatedSettings,
				},
			} );

			// Persist to server
			await saveUser( {
				id: userId,
				meta: {
					jetpack_social: updatedSettings,
				},
			} );
		},
		[ userId, currentUser, settings, saveUser, receiveCurrentUser ]
	);

	return useMemo(
		() => ( {
			settings,
			updateSettings,
			isLoading,
			isSaving,
		} ),
		[ settings, updateSettings, isLoading, isSaving ]
	);
}
