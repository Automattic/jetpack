/**
 * External dependencies
 */
import { useAiFeature } from '@automattic/jetpack-ai-client';
import { getSiteType } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { Button, Notice } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import {
	openWordPressAgent,
	useIsWordPressAgentChatVisible,
	useIsWordPressAgentReady,
} from './open-agent';
/**
 * Types
 */
import type {
	EditorSelect,
	PreferencesSelect,
	WordPressAgentNoticeEventProperties,
	WordPressAgentNoticePlacement,
	WordPressAgentNoticeProps,
} from './types';

export const AGENT_NOTICE_FEATURE = 'ai-sidebar-agent-notice';
export const PREFERENCE_SCOPE = 'jetpack/ai-assistant';
export const DISMISSED_PREFERENCE = 'wordpressAgentNoticeDismissed';

// Addressed as a string on purpose: importing the store object would register
// it as a side effect.
const EDITOR_STORE = 'core/editor';

function useEventProperties(
	placement: WordPressAgentNoticePlacement
): WordPressAgentNoticeEventProperties {
	const { currentTier } = useAiFeature();
	const postType = useSelect(
		select => ( select( EDITOR_STORE ) as EditorSelect )?.getCurrentPostType?.(),
		[]
	);

	return {
		placement,
		site_type: getSiteType(),
		...( postType ? { post_type: postType } : {} ),
		...( currentTier?.slug ? { current_tier_slug: currentTier.slug } : {} ),
	};
}

/**
 * Whether to show the notice, or nothing at all in its place.
 *
 * Both are false where the site has no WordPress Agent, leaving the AI panel as
 * it was. One shared preference backs the dismissal, so closing the notice in
 * any placement closes it in all of them.
 *
 * @return {{isVisible: boolean, isDismissed: boolean}} The notice's state.
 */
export function useWordPressAgentNotice(): { isVisible: boolean; isDismissed: boolean } {
	const hasDismissed = useSelect(
		select =>
			!! ( select( preferencesStore ) as PreferencesSelect ).get(
				PREFERENCE_SCOPE,
				DISMISSED_PREFERENCE
			),
		[]
	);

	const isAvailable = getFeatureAvailability( AGENT_NOTICE_FEATURE );

	return {
		isVisible: isAvailable && ! hasDismissed,
		isDismissed: isAvailable && hasDismissed,
	};
}

/**
 * Points people at the WordPress Agent from where the Jetpack AI panel used to be.
 *
 * Only the close button dismisses. Opening the Agent leaves the notice in place,
 * so someone who tries it still finds it on their next visit.
 *
 * @param {object} props           - Component props.
 * @param {string} props.placement - Where the notice is rendered, recorded with each event.
 * @return {JSX.Element} The notice.
 */
export default function WordPressAgentNotice( { placement }: WordPressAgentNoticeProps ) {
	const { tracks } = useAnalytics();
	const { set } = useDispatch( preferencesStore );
	const eventProperties = useEventProperties( placement );
	const isAgentReady = useIsWordPressAgentReady();
	const isChatOnScreen = useIsWordPressAgentChatVisible();

	const openAgent = () => {
		tracks.recordEvent( 'jetpack_ai_agent_notice_click', eventProperties );
		openWordPressAgent();
	};

	const movedMessage = __(
		'AI tools have a new home with a new interface and content guidelines built in.',
		'jetpack'
	);
	const chatOpenMessage = __(
		'AI tools have a new home in the WordPress Agent. It’s open now.',
		'jetpack'
	);

	const dismiss = () => {
		tracks.recordEvent( 'jetpack_ai_agent_notice_dismiss', eventProperties );
		set( PREFERENCE_SCOPE, DISMISSED_PREFERENCE, true );
		// The notice and its panel both go, taking focus with them.
		speak( __( 'Notice dismissed.', 'jetpack' ), 'polite' );
	};

	return (
		// Notice.Root speaks its children by default; this notice appears on every load.
		<Notice.Root intent="info" icon={ null } spokenMessage="">
			<Notice.Description>{ isChatOnScreen ? chatOpenMessage : movedMessage }</Notice.Description>

			{ isAgentReady && ! isChatOnScreen && (
				<Notice.Actions>
					<Button size="compact" onClick={ openAgent }>
						{ /* translators: Button that opens the WordPress Agent chat. "WordPress Agent" is a product name. */ }
						{ __( 'Open WordPress Agent', 'jetpack' ) }
					</Button>
				</Notice.Actions>
			) }

			<Notice.CloseIcon onClick={ dismiss } />
		</Notice.Root>
	);
}
