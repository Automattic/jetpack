import { __, sprintf } from '@wordpress/i18n';
import type { AiTool } from './lib.ts';

/**
 * The "Bring your AI tool" experiment's copy: the setup choice and the "Which AI do you use?" view.
 *
 * @return The experiment's copy.
 */
export function bringYourAiToolCopy() {
	const toolName = ( aiTool: AiTool ) =>
		aiTool === 'chatgpt' ? __( 'ChatGPT', 'jetpack-mu-wpcom' ) : __( 'Claude', 'jetpack-mu-wpcom' );
	return {
		choiceTitle: __( 'How would you like to get set up?', 'jetpack-mu-wpcom' ),
		guideTitle: __( 'Guide me', 'jetpack-mu-wpcom' ),
		guideDescription: __(
			"Pick a goal and we'll tailor a setup checklist for you.",
			'jetpack-mu-wpcom'
		),
		useAiTitle: __( 'Build with AI', 'jetpack-mu-wpcom' ),
		useAiDescription: __(
			'Connect ChatGPT or Claude and build your site by chatting.',
			'jetpack-mu-wpcom'
		),
		freeBadge: __( 'Free 30 days', 'jetpack-mu-wpcom' ),
		freeTooltip: __(
			'Using your AI with WordPress.com usually needs a paid plan. It’s free on your site for 30 days.',
			'jetpack-mu-wpcom'
		),
		toolName,
		viewTitle: __( 'Which AI do you use?', 'jetpack-mu-wpcom' ),
		viewSubtitle: __(
			'Add WordPress.com there and allow access. Then build your site by chatting.',
			'jetpack-mu-wpcom'
		),
		waitingTitle: ( aiTool: AiTool ) =>
			sprintf(
				/* translators: %s: the AI tool's name, ChatGPT or Claude. */
				__( 'Finish setting up in %s', 'jetpack-mu-wpcom' ),
				toolName( aiTool )
			),
		waitingSubtitle: __(
			'Install the WordPress plugin and allow access. This page updates once you’re connected.',
			'jetpack-mu-wpcom'
		),
		connectedTitle: ( aiTool: AiTool ) =>
			sprintf(
				/* translators: %s: the AI tool's name, ChatGPT or Claude. */
				__( '%s is connected', 'jetpack-mu-wpcom' ),
				toolName( aiTool )
			),
		connectedSubtitle: ( aiTool: AiTool, otherTool: AiTool ) =>
			sprintf(
				/* translators: %1$s: the connected AI tool's name. %2$s: the other AI tool's name. Each is ChatGPT or Claude. */
				__( 'Open %1$s and describe the site you want. You can add %2$s too.', 'jetpack-mu-wpcom' ),
				toolName( aiTool ),
				toolName( otherTool )
			),
		bothConnectedTitle: __( 'ChatGPT and Claude are connected', 'jetpack-mu-wpcom' ),
		bothConnectedSubtitle: __(
			'Open either one and describe the site you want.',
			'jetpack-mu-wpcom'
		),
		readOnlyTitle: ( aiTool: AiTool ) =>
			sprintf(
				/* translators: %s: the AI tool's name, ChatGPT or Claude. */
				__( '%s can’t build your site yet', 'jetpack-mu-wpcom' ),
				toolName( aiTool )
			),
		readOnlySubtitle: __(
			'It has read-only access, so it can view your site but not change it.',
			'jetpack-mu-wpcom'
		),
		readOnlyDescription: __( 'Can view your site, but not change it', 'jetpack-mu-wpcom' ),
		readOnly: __( 'Read only', 'jetpack-mu-wpcom' ),
		allowFullAccess: __( 'Allow full access', 'jetpack-mu-wpcom' ),
		allowFullAccessFailed: __(
			'Full access couldn’t be allowed here. Allow it in your WordPress.com settings.',
			'jetpack-mu-wpcom'
		),
		allowingFullAccess: __( 'Allowing full access', 'jetpack-mu-wpcom' ),
		opensInNewTab: __( 'Opens in a new tab', 'jetpack-mu-wpcom' ),
		openedInNewTab: __( 'Opened in a new tab', 'jetpack-mu-wpcom' ),
		connectedToAccount: __( 'Connected to your WordPress.com account', 'jetpack-mu-wpcom' ),
		setUp: __( 'Set up', 'jetpack-mu-wpcom' ),
		otherToolTitle: __( 'Another AI tool', 'jetpack-mu-wpcom' ),
		otherToolDescription: __( 'Copy a prompt and paste it into your AI', 'jetpack-mu-wpcom' ),
		copyPrompt: __( 'Copy prompt', 'jetpack-mu-wpcom' ),
		copied: __( 'Copied', 'jetpack-mu-wpcom' ),
		waiting: __( 'Waiting', 'jetpack-mu-wpcom' ),
		connected: __( 'Connected', 'jetpack-mu-wpcom' ),
		openTool: ( aiTool: AiTool ) =>
			sprintf(
				/* translators: %s: the AI tool's name, ChatGPT or Claude. */
				__( 'Open %s', 'jetpack-mu-wpcom' ),
				toolName( aiTool )
			),
		goToDashboard: __( 'Go to my dashboard', 'jetpack-mu-wpcom' ),
	};
}
