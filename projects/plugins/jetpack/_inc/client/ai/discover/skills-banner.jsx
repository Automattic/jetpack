/**
 * What skills are, in a compact take on the Overview's dark-green banner.
 * Dismissed per user through the preferences store, as the Overview's
 * assistant banner is (see overview/assistant-banner).
 */

import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { Path, SVG } from '@wordpress/primitives';
import AiBanner from '../../../shared/components/ai-banner';
import { recordAiHubEvent } from '../tracks';

const PREFERENCE_SCOPE = 'jetpack/ai';
export const PREFERENCE_NAME = 'skillsBannerDismissed';

// An open book in the category icons' outline style; @wordpress/icons has none.
const openBook = (
	<SVG
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		stroke="currentColor"
		strokeWidth={ 1.5 }
		strokeLinejoin="round"
	>
		<Path d="M12 6.5C10.5 5.4 8.5 4.75 4.75 4.75v12.5c3.75 0 5.75.65 7.25 1.75 1.5-1.1 3.5-1.75 7.25-1.75V4.75c-3.75 0-5.75.65-7.25 1.75Zm0 0V19" />
	</SVG>
);

/**
 * Dismissible banner explaining skills.
 *
 * @return {object|null} Component markup, or null once dismissed.
 */
export default function SkillsBanner() {
	const dismissed = useSelect(
		select => select( preferencesStore ).get( PREFERENCE_SCOPE, PREFERENCE_NAME ),
		[]
	);
	const { set } = useDispatch( preferencesStore );

	const handleDismiss = useCallback( () => {
		set( PREFERENCE_SCOPE, PREFERENCE_NAME, true );
		recordAiHubEvent( 'jetpack_ai_hub_skills_banner_dismiss' );
	}, [ set ] );

	if ( dismissed ) {
		return null;
	}

	return (
		<AiBanner
			className="jetpack-ai-discover__banner"
			icon={ openBook }
			title={ __( 'What are skills?', 'jetpack' ) }
			description={ __(
				'Skills turn your AI agent into a WordPress expert. Each one is an expert playbook from the WordPress.com team that walks your agent through a job step by step. Send a skill to your agent and it knows exactly what to do.',
				'jetpack'
			) }
			onDismiss={ handleDismiss }
			dismissLabel={ __( 'Dismiss', 'jetpack' ) }
		/>
	);
}
