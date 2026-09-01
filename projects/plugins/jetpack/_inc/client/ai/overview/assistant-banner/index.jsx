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
import analytics from 'lib/analytics';
import AiBanner from '../../../../shared/components/ai-banner';

const PREFERENCE_SCOPE = 'jetpack/ai';
const PREFERENCE_NAME = 'assistantBannerDismissed';

/**
 * Audience properties per the AI-product Tracks standards, encoded as
 * 'true'/'false' strings — same shape as mcp/tracks.js, which is documented
 * as jetpack_mcp_*-only and so not reused here.
 *
 * @return {object} Tracks audience properties.
 */
function getAudienceProps() {
	const { isA11n = false, isTest = false } = window?.jetpackAiSettings ?? {};
	return {
		is_a11n: isA11n ? 'true' : 'false',
		is_test: isTest ? 'true' : 'false',
	};
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
		analytics.tracks.recordEvent( 'jetpack_ai_hub_assistant_banner_dismiss', getAudienceProps() );
	}, [ set ] );

	const handleCtaClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_ai_hub_assistant_banner_cta_click', getAudienceProps() );
	}, [] );

	if ( dismissed ) {
		return null;
	}

	return (
		<AiBanner
			title={ __( 'Your site now has an assistant.', 'jetpack' ) }
			description={ __(
				'Turn your ideas into ready-to-publish content at lightspeed. Make changes across your site using ChatGPT, Claude, Slack, or right here.',
				'jetpack'
			) }
			actions={
				<>
					<Button
						className="jetpack-ai-banner__cta"
						variant="primary"
						href="#/mcp"
						onClick={ handleCtaClick }
					>
						{ __( 'Connect your agent', 'jetpack' ) }
					</Button>
					<Button
						className="jetpack-ai-banner__close-text"
						variant="tertiary"
						onClick={ handleDismiss }
					>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</>
			}
			onDismiss={ handleDismiss }
			dismissLabel={ __( 'Dismiss', 'jetpack' ) }
		/>
	);
}
