import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

const NAMESPACE = 'jetpack/social';

export type JetpackSocialPreferencesHook = {
	showPrePublishConfirmation: boolean;
	togglePrePublishConfirmation: VoidFunction;
};

/**
 * Hook to manage Jetpack Social preferences in the block editor.
 *
 * @return JetpackSocialPreferencesHook hook.
 */
export function useJetpackSocialPreferences(): JetpackSocialPreferencesHook {
	const { toggle } = useDispatch( preferencesStore );

	const showPrePublishConfirmation = useSelect(
		select => ! select( preferencesStore ).get( NAMESPACE, 'hide_pre_publish_confirmation' ),
		[]
	);

	const togglePrePublishConfirmation = useCallback( () => {
		toggle( NAMESPACE, 'hide_pre_publish_confirmation' );
	}, [ toggle ] );

	return useMemo(
		() => ( {
			showPrePublishConfirmation,
			togglePrePublishConfirmation,
		} ),
		[ showPrePublishConfirmation, togglePrePublishConfirmation ]
	);
}
