/**
 * External dependencies
 */
import { useAiFeature } from '@automattic/jetpack-ai-client';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getMyJetpackUrl, getSiteType } from '@automattic/jetpack-script-data';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { Button, Icon, LinkButton, Notice } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import bigSkyIcon from './big-sky-icon';
import {
	isAgentActionAvailable,
	resumeWordPressAgentChat,
	setWordPressAgentChatOpen,
	useIsWordPressAgentChatVisible,
	useIsWordPressAgentReady,
} from './open-agent';
import { getTracksAudienceProperties } from './tracks-audience';
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

const DOCS_URL = getRedirectUrl( 'jetpack-ai-docs-wordpress-agent' );

// Addressed as a string on purpose: importing the store object would register
// it as a side effect.
const EDITOR_STORE = 'core/editor';

// Keeps a label on one line in a narrow sidebar; the docs link wraps instead.
const ACTION_BUTTON_STYLE = { flexShrink: 0 } as const;

/**
 * Where a site turns the WordPress Agent on, matching the wpcom dashboard banner.
 *
 * @return {string} The settings URL.
 */
function getEnableAgentUrl(): string {
	if ( getSiteType() === 'jetpack' ) {
		return getMyJetpackUrl( '#/overview' );
	}

	return `https://wordpress.com/sites/${ getSiteFragment() }/settings/ai-tools`;
}

function useEventProperties(
	placement: WordPressAgentNoticePlacement
): WordPressAgentNoticeEventProperties {
	const { currentTier } = useAiFeature();
	const { hasEditorStore, postType } = useSelect( select => {
		const editor = select( EDITOR_STORE ) as EditorSelect | undefined;
		return { hasEditorStore: !! editor, postType: editor?.getCurrentPostType?.() };
	}, [] );

	return {
		// First on purpose: an explicit key below always wins over an audience one.
		...getTracksAudienceProperties(),
		placement,
		// Derived as the family recorder derives it: present while the editor store is.
		...( hasEditorStore ? { surface: 'block_editor' as const } : {} ),
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
	// Both needed: eligible-only sites reach here with no chat, and a mounted
	// chat may belong to another provider.
	const canOpenAgent = isAgentActionAvailable();
	const isAgentReady = useIsWordPressAgentReady();
	const isChatOnScreen = useIsWordPressAgentChatVisible();

	const openAgent = () => {
		tracks.recordEvent( 'jetpack_big_sky_agent_notice_click', {
			...eventProperties,
			action: 'open',
		} );
		// Reset the view first, as the editor's Ask AI button does, so the chat
		// always opens on the same screen however it was last left.
		resumeWordPressAgentChat();
		setWordPressAgentChatOpen( true );
	};

	const recordEnableClick = () => {
		tracks.recordEvent( 'jetpack_big_sky_agent_notice_click', {
			...eventProperties,
			action: 'enable',
		} );
	};

	const dismiss = () => {
		tracks.recordEvent( 'jetpack_big_sky_agent_notice_dismiss', eventProperties );
		set( PREFERENCE_SCOPE, DISMISSED_PREFERENCE, true );
		// The notice and its panel both go, taking focus with them.
		speak( __( 'Notice dismissed.', 'jetpack' ), 'polite' );
	};

	return (
		// Notice.Root speaks its children by default; this notice appears on every load.
		<Notice.Root
			intent="info"
			icon={ null }
			spokenMessage=""
			// The notice's middle column is `1fr`, which refuses to shrink below its
			// contents and so pushes the close button outside a narrow sidebar.
			style={ { gridTemplateColumns: 'auto minmax(0, 1fr) auto' } }
		>
			<Notice.Description>
				{ canOpenAgent
					? createInterpolateElement(
							// translators: <icon /> is replaced with the WordPress Agent's icon, so keep the tag
							// as written. "Ask AI" is the label on a button in the editor toolbar.
							__(
								'AI tools have moved to the WordPress Agent. Look for the "Ask AI" <icon /> button at the top of the screen.',
								'jetpack'
							),
							{
								icon: (
									<Icon
										icon={ bigSkyIcon }
										size={ 16 }
										style={ { verticalAlign: 'text-bottom' } }
									/>
								),
							}
					  )
					: __( 'AI tools have moved to the WordPress Agent.', 'jetpack' ) }
			</Notice.Description>

			<Notice.Actions>
				{ canOpenAgent && isAgentReady && (
					<Button
						variant="outline"
						style={ ACTION_BUTTON_STYLE }
						onClick={ openAgent }
						disabled={ isChatOnScreen }
						// Replaces the visible label, so it must still name the button.
						aria-label={
							isChatOnScreen ? __( 'WordPress Agent is already open', 'jetpack' ) : undefined
						}
					>
						{ /* translators: Button that opens the WordPress Agent chat. "WordPress Agent" is a product name. */ }
						{ __( 'Open WordPress Agent', 'jetpack' ) }
					</Button>
				) }

				{ ! canOpenAgent && (
					<LinkButton
						variant="outline"
						style={ ACTION_BUTTON_STYLE }
						// Same tab: the editor's unsaved-changes prompt guards the draft.
						href={ getEnableAgentUrl() }
						onClick={ recordEnableClick }
					>
						{ /* translators: Button that leads to the settings page where the WordPress Agent is turned on. "WordPress Agent" is a product name. */ }
						{ __( 'Enable WordPress Agent', 'jetpack' ) }
					</LinkButton>
				) }

				<Notice.ActionLink href={ DOCS_URL } openInNewTab>
					{ __( 'Learn more', 'jetpack' ) }
				</Notice.ActionLink>
			</Notice.Actions>

			<Notice.CloseIcon onClick={ dismiss } />
		</Notice.Root>
	);
}
