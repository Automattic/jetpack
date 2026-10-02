/**
 * Assistant announcement banner — the shared dark-green AiBanner at the top
 * of the Overview tab. Dismissal is per-user via the preferences store:
 * core's inline bootstrap on the wp-preferences script handle (which this
 * bundle's DependencyExtraction externalizes to) preloads the user's
 * persisted_preferences meta and wires the persistence layer, so reads are
 * flash-free and writes sync across the user's devices with no wiring here.
 * The layer debounces writes — a dismiss followed by instantly leaving the
 * page can lose the write, in which case the banner just shows once more.
 */

import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import AiBanner from '../../../../shared/components/ai-banner';
import { recordAiHubEvent } from '../../tracks';

const PREFERENCE_SCOPE = 'jetpack/ai';
const PREFERENCE_NAME = 'assistantBannerDismissed';

/**
 * Dismissible assistant announcement banner.
 *
 * @return {object|null} Component markup, or null once dismissed.
 */
export default function AssistantBanner() {
	const dismissed = useSelect(
		select => select( preferencesStore ).get( PREFERENCE_SCOPE, PREFERENCE_NAME ),
		[]
	);
	const { set } = useDispatch( preferencesStore );

	const handleDismiss = useCallback( () => {
		// The store updates synchronously (banner hides at once); the layer
		// persists in the background.
		set( PREFERENCE_SCOPE, PREFERENCE_NAME, true );
		recordAiHubEvent( 'jetpack_ai_hub_assistant_banner_dismiss' );
	}, [ set ] );

	if ( dismissed ) {
		return null;
	}

	return (
		<AiBanner
			className="jetpack-ai-overview__assistant-banner"
			title={ __( 'Do more on your site with AI.', 'jetpack' ) }
			description={ __(
				'Write, edit, and make changes across your whole site. Start in the editor, or connect ChatGPT or Claude and work from there.',
				'jetpack'
			) }
			onDismiss={ handleDismiss }
			dismissLabel={ __( 'Dismiss', 'jetpack' ) }
		/>
	);
}
