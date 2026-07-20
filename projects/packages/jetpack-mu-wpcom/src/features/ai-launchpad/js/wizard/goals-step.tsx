import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { pencil, tool, store, envelope, people, gallery } from '@wordpress/icons';
import type { GoalSlug } from '../lib/types.ts';

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
}

/**
 * Step 1 of the wizard: pick a goal from six radio cards.
 *
 * @param props          - Component props.
 * @param props.value    - The currently selected goal, or null.
 * @param props.onChange - Called with the goal the user clicks.
 * @return The goals step.
 */
export default function GoalsStep( { value, onChange }: Props ) {
	return (
		<div className="ai-launchpad-wizard__step">
			<div className="ai-launchpad-wizard__step-header">
				<h2 className="ai-launchpad-wizard__step-title">
					{ __( "What's your main goal?", 'jetpack-mu-wpcom' ) }
				</h2>
				<p className="ai-launchpad-wizard__step-subtitle">
					{ __( "We'll tailor your next steps to help you launch.", 'jetpack-mu-wpcom' ) }
				</p>
			</div>
			<div className="ai-launchpad-wizard__cards" role="radiogroup">
				{ goalOptions().map( option => {
					const selected = value === option.key;
					return (
						<button
							key={ option.key }
							type="button"
							role="radio"
							aria-checked={ selected }
							className={ 'ai-launchpad-wizard__card' + ( selected ? ' is-selected' : '' ) }
							onClick={ () => onChange( option.key ) }
						>
							<Icon icon={ option.icon } size={ 20 } />
							<span className="ai-launchpad-wizard__card-text">
								<span className="ai-launchpad-wizard__card-title">{ option.title }</span>
								<span className="ai-launchpad-wizard__card-description">
									{ option.description }
								</span>
							</span>
						</button>
					);
				} ) }
			</div>
		</div>
	);
}
