/**
 * Assistant announcement banner — dark-green callout at the top of the
 * Overview tab. Dismissal is per-user via the preferences store: core's
 * inline bootstrap on the wp-preferences script handle (which this bundle's
 * DependencyExtraction externalizes to) preloads the user's
 * persisted_preferences meta and wires the persistence layer, so reads are
 * flash-free and writes sync across the user's devices with no wiring here.
 * The layer debounces writes — a dismiss followed by instantly leaving the
 * page can lose the write, in which case the banner just shows once more.
 */

import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import analytics from 'lib/analytics';

import './style.scss';

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
 * The mock's mark: the Jetpack circle-and-bolt recolored — bright green disc
 * with the glyph cut out in the banner's dark green. jetpack-components'
 * JetpackIcon hardcodes white polygons, so the same geometry is inlined here
 * with the fills the banner needs. Colors are sampled from the announcement
 * mock, like everything else on the banner.
 *
 * @return {object} Component markup.
 */
function AiLogoMark() {
	return (
		<svg
			className="jetpack-ai-overview-banner__logo"
			viewBox="0 0 32 32"
			width="20"
			height="20"
			aria-hidden="true"
			focusable="false"
		>
			<path fill="#48ff50" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z" />
			<polygon fill="#003010" points="15,19 7,19 15,3" />
			<polygon fill="#003010" points="17,29 17,13 25,13" />
		</svg>
	);
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

	if ( dismissed ) {
		return null;
	}

	return (
		<div className="jetpack-ai-overview-banner">
			<div className="jetpack-ai-overview-banner__glow" aria-hidden="true" />
			<div className="jetpack-ai-overview-banner__intro">
				<AiLogoMark />
				<div className="jetpack-ai-overview-banner__intro-text">
					<h2 className="jetpack-ai-overview-banner__title">
						{ __( 'Your site now has an assistant.', 'jetpack' ) }
					</h2>
					<p className="jetpack-ai-overview-banner__description">
						{ __(
							'Turn your ideas into ready-to-publish content at lightspeed. Make changes across your site using ChatGPT, Claude, Slack, or right here.',
							'jetpack'
						) }
					</p>
				</div>
			</div>
			<Button
				className="jetpack-ai-overview-banner__dismiss"
				icon={ close }
				label={ __( 'Dismiss', 'jetpack' ) }
				onClick={ handleDismiss }
			/>
		</div>
	);
}
