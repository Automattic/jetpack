import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil, tool, store, envelope, people, gallery } from '@wordpress/icons';
import { Dialog, Icon, Stack, Text } from '@wordpress/ui';
import type { GoalSlug } from '../lib/types.ts';
import type { Ref } from 'react';

interface GoalOption {
	key: GoalSlug;
	title: string;
	description: string;
	icon: typeof pencil;
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
