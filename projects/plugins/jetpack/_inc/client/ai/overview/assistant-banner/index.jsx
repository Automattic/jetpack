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

import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import AiBanner from '../../../../shared/components/ai-banner';
import { recordAiHubEvent } from '../../tracks';

const PREFERENCE_SCOPE = 'jetpack/ai';
const PREFERENCE_NAME = 'assistantBannerDismissed';

/**
 * New-post link that starts the user in the AI writing flow.
 *
 * With the page's nonce, use_ai_block makes My Jetpack's default_content
 * filter drop an AI Assistant block into the empty post. Without it (e.g.
 * stale page HTML), fall back to just pre-opening the sidebar AI panel.
 *
 * @return {string} href for the banner CTA.
 */
function getStartWritingUrl() {
	const nonce = window?.jetpackAiSettings?.aiBlockNonce;
	if ( nonce ) {
		return `post-new.php?use_ai_block=1&_wpnonce=${ encodeURIComponent( nonce ) }`;
	}
	return 'post-new.php?openSidebar=jetpack-ai-assistant';
}

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

	const handleStartWritingClick = useCallback( () => {
		recordAiHubEvent( 'jetpack_ai_hub_assistant_banner_cta_click', { cta: 'start-writing' } );
	}, [] );

	if ( dismissed ) {
		return null;
	}

	return (
		<AiBanner
			title={ __( 'Do more on your site with AI.', 'jetpack' ) }
			description={ __(
				'Write, edit, and make changes across your whole site. Start in the editor, or connect ChatGPT or Claude and work from there.',
				'jetpack'
			) }
			actions={
				<Button
					className="jetpack-ai-banner__cta"
					variant="primary"
					href={ getStartWritingUrl() }
					onClick={ handleStartWritingClick }
				>
					{ __( 'Start writing', 'jetpack' ) }
				</Button>
			}
			onDismiss={ handleDismiss }
			dismissLabel={ __( 'Dismiss', 'jetpack' ) }
		/>
	);
}
