import { useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { pencil, tool, store, envelope, people, gallery } from '@wordpress/icons';
import { Dialog, Icon, Stack, Text } from '@wordpress/ui';
import type { AiTool } from './lib.ts';
import type { GoalSlug } from '../lib/types.ts';
import type { Ref } from 'react';

interface GoalOption {
	key: GoalSlug;
	title: string;
	description: string;
	icon: typeof pencil;
}

/**
 * The "Bring your AI tool" experiment's copy: the setup choice and the "Which AI do you use?" view.
 *
 * @return The experiment's copy.
 */
export function bringYourAiToolCopy() {
	const toolName = ( aiTool: AiTool ) =>
		aiTool === 'chatgpt' ? __( 'ChatGPT', 'jetpack-mu-wpcom' ) : __( 'Claude', 'jetpack-mu-wpcom' );
	return {
		choiceTitle: __( 'How do you want to build your site?', 'jetpack-mu-wpcom' ),
		guideTitle: __( 'Guide me', 'jetpack-mu-wpcom' ),
		guideDescription: __(
			"Pick a goal and we'll tailor a setup checklist for you.",
			'jetpack-mu-wpcom'
		),
		useAiTitle: __( 'Build with my AI', 'jetpack-mu-wpcom' ),
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
		opensInNewTab: __( 'Opens in a new tab', 'jetpack-mu-wpcom' ),
		openedInNewTab: __( 'Opened in a new tab', 'jetpack-mu-wpcom' ),
		connectedToAccount: __( 'Connected to your WordPress.com account', 'jetpack-mu-wpcom' ),
		setUp: __( 'Set up', 'jetpack-mu-wpcom' ),
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

/**
 * The six goal cards shown on step 1.
 *
 * @return The goal options.
 */
function goalOptions(): GoalOption[] {
	return [
		{
			key: 'write',
			title: __( 'Start a blog', 'jetpack-mu-wpcom' ),
			description: __( 'Share your ideas, stories, or expertise.', 'jetpack-mu-wpcom' ),
			icon: pencil,
		},
		{
			key: 'build',
			title: __( 'Build a website', 'jetpack-mu-wpcom' ),
			description: __(
				'Create a presence for a project, business, or yourself.',
				'jetpack-mu-wpcom'
			),
			icon: tool,
		},
		{
			key: 'sell',
			title: __( 'Sell online', 'jetpack-mu-wpcom' ),
			description: __( 'Set up a store for digital or physical goods.', 'jetpack-mu-wpcom' ),
			icon: store,
		},
		{
			key: 'newsletter',
			title: __( 'Start a newsletter', 'jetpack-mu-wpcom' ),
			description: __( 'Reach subscribers directly in their inbox.', 'jetpack-mu-wpcom' ),
			icon: envelope,
		},
		{
			key: 'educate',
			title: __( 'Educate', 'jetpack-mu-wpcom' ),
			description: __( 'Teach students, run courses, or grow a community.', 'jetpack-mu-wpcom' ),
			icon: people,
		},
		{
			key: 'portfolio',
			title: __( 'Build a portfolio', 'jetpack-mu-wpcom' ),
			description: __( 'Showcase your work, projects, or creative side.', 'jetpack-mu-wpcom' ),
			icon: gallery,
		},
	];
}

interface Props {
	value: GoalSlug | null;
	onChange: ( value: GoalSlug ) => void;
	titleRef?: Ref< HTMLHeadingElement >;
}

/**
 * Step 1 of the wizard: pick a goal from six radio cards.
 *
 * @param props          - Component props.
 * @param props.value    - The currently selected goal, or null.
 * @param props.onChange - Called with the goal the user picks.
 * @param props.titleRef - Ref to the step title, the dialog's initial focus target.
 * @return The goals step.
 */
export default function GoalsStep( { value, onChange, titleRef }: Props ) {
	const id = useId();
	const titleId = `${ id }-title`;

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="column" gap="xs">
				<Dialog.Title
					ref={ titleRef }
					id={ titleId }
					tabIndex={ -1 }
					className="ai-launchpad-wizard__title"
				>
					{ __( "What's your main goal?", 'jetpack-mu-wpcom' ) }
				</Dialog.Title>
				<Text render={ <p /> } className="ai-launchpad-wizard__step-subtitle">
					{ __( "We'll tailor your next steps to help you launch.", 'jetpack-mu-wpcom' ) }
				</Text>
			</Stack>
			<div className="ai-launchpad-wizard__cards" role="radiogroup" aria-labelledby={ titleId }>
				{ goalOptions().map( option => {
					const selected = value === option.key;
					const inputId = `${ id }-${ option.key }`;
					const optionTitleId = `${ id }-${ option.key }-title`;
					const optionDescriptionId = `${ id }-${ option.key }-description`;
					return (
						<label
							key={ option.key }
							htmlFor={ inputId }
							className={ 'ai-launchpad-wizard__card' + ( selected ? ' is-selected' : '' ) }
						>
							<input
								id={ inputId }
								type="radio"
								name={ `${ id }-goal` }
								value={ option.key }
								checked={ selected }
								onChange={ () => onChange( option.key ) }
								aria-labelledby={ optionTitleId }
								aria-describedby={ optionDescriptionId }
								className="ai-launchpad-wizard__card-input"
							/>
							<Icon icon={ option.icon } size={ 20 } />
							<Stack
								direction="column"
								gap="xs"
								render={ <span /> }
								className="ai-launchpad-wizard__card-text"
							>
								<Text variant="heading-md" id={ optionTitleId }>
									{ option.title }
								</Text>
								<Text
									variant="body-sm"
									id={ optionDescriptionId }
									className="ai-launchpad-wizard__card-description"
								>
									{ option.description }
								</Text>
							</Stack>
						</label>
					);
				} ) }
			</div>
		</Stack>
	);
}
