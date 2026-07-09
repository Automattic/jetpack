import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

const NAMESPACE = 'jetpack/social';

export type SocialUserPreferences = {
	/**
	 * Whether to show a confirmation before publishing a post with social shares.
	 */
	showPrePublishConfirmation: boolean | undefined;
};

type BooleanPreferences = {
	[ K in keyof SocialUserPreferences ]: SocialUserPreferences[ K ] extends boolean | undefined
		? K
		: never;
}[ keyof SocialUserPreferences ];

type Preference = keyof SocialUserPreferences;

const PREFERENCES: Record< Preference, string > = {
	showPrePublishConfirmation: 'show_pre_publish_confirmation',
} as const;

/**
 * Hook to manage a user's preferences for Jetpack Social in the block editor.
 *
 * @return User preferences.
 */
export function useSocialUserPreferences() {
	const preferences = useDispatch( preferencesStore );

	const data = useSelect( select => {
		const store = select( preferencesStore );

		return Object.fromEntries(
			Object.entries( PREFERENCES ).map( ( [ key, name ] ) => {
				const preferenceValue = store.get( NAMESPACE, name );
				return [ key, preferenceValue ];
			} )
		) as SocialUserPreferences;
	}, [] );

	const toggle = useCallback(
		( preference: BooleanPreferences ) => {
			preferences.toggle( NAMESPACE, PREFERENCES[ preference ] );
		},
		[ preferences ]
	);

	const set = useCallback(
		< P extends Preference >( preference: P, value: SocialUserPreferences[ P ] ) => {
			preferences.set( NAMESPACE, PREFERENCES[ preference ], value );
		},
		[ preferences ]
	);

	return useMemo(
		() => ( {
			data,
			set,
			toggle,
		} ),
		[ data, set, toggle ]
	);
}
