import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

const NAMESPACE = 'jetpack/social';

const PREFERENCES = {
	PRE_PUBLISH_CONFIRMATION: 'pre_publish_confirmation__2',
};

export type JetpackSocialPreferencesHook = {
	showPrePublishConfirmation: boolean | undefined;
	togglePrePublishConfirmation: VoidFunction;
	setShowPrePublishConfirmation: ( value: boolean ) => void;
};

/**
 * Hook to manage Jetpack Social preferences in the block editor.
 *
 * @return JetpackSocialPreferencesHook hook.
 */
export function useJetpackSocialPreferences(): JetpackSocialPreferencesHook {
	const { toggle, set } = useDispatch( preferencesStore );

	const showPrePublishConfirmation = useSelect(
		select => select( preferencesStore ).get( NAMESPACE, PREFERENCES.PRE_PUBLISH_CONFIRMATION ),
		[]
	);

	const togglePrePublishConfirmation = useCallback( () => {
		toggle( NAMESPACE, PREFERENCES.PRE_PUBLISH_CONFIRMATION );
	}, [ toggle ] );

	const setShowPrePublishConfirmation = useCallback(
		( value: boolean ) => {
			set( NAMESPACE, PREFERENCES.PRE_PUBLISH_CONFIRMATION, value );
		},
		[ set ]
	);

	return useMemo(
		() => ( {
			showPrePublishConfirmation,
			setShowPrePublishConfirmation,
			togglePrePublishConfirmation,
		} ),
		[ showPrePublishConfirmation, togglePrePublishConfirmation, setShowPrePublishConfirmation ]
	);
}
