import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

const NAMESPACE = 'jetpack/social';

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
		select => select( preferencesStore ).get( NAMESPACE, 'show_pre_publish_confirmation' ),
		[]
	);

	const togglePrePublishConfirmation = useCallback( () => {
		toggle( NAMESPACE, 'show_pre_publish_confirmation' );
	}, [ toggle ] );

	const setShowPrePublishConfirmation = useCallback(
		( value: boolean ) => {
			set( NAMESPACE, 'show_pre_publish_confirmation', value );
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
