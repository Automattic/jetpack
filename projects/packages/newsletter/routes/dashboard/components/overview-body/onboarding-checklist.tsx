import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';

type ChecklistStep = {
	title: string;
	description: string;
	primaryAction?: string;
	secondaryAction?: string;
	complete?: boolean;
	defaultOpen?: boolean;
};

const STEPS: ChecklistStep[] = [
	{
		title: __( 'Start a newsletter', 'jetpack-newsletter' ),
		description: __( 'Your newsletter is ready to welcome subscribers.', 'jetpack-newsletter' ),
		complete: true,
	},
	{
		title: __( 'Make it your own', 'jetpack-newsletter' ),
		description: __(
			'Customize your newsletter with a name, tagline, and more.',
			'jetpack-newsletter'
		),
		primaryAction: __( 'Customize', 'jetpack-newsletter' ),
		secondaryAction: __( 'Skip', 'jetpack-newsletter' ),
		defaultOpen: true,
	},
	{
		title: __( 'Write your first post', 'jetpack-newsletter' ),
		description: __( 'Create a post to send your first newsletter email.', 'jetpack-newsletter' ),
		primaryAction: __( 'Write a post', 'jetpack-newsletter' ),
	},
	{
		title: __( 'Share your newsletter', 'jetpack-newsletter' ),
		description: __( 'Invite readers to subscribe to your newsletter.', 'jetpack-newsletter' ),
		primaryAction: __( 'Share', 'jetpack-newsletter' ),
	},
];

/**
 * Render the Newsletter onboarding checklist.
 *
 * @return The onboarding checklist.
 */
export default function OnboardingChecklist(): JSX.Element {
	return (
		<Stack direction="column" gap="sm" className="jetpack-newsletter-overview__checklist">
			{ STEPS.map( step => (
				<CollapsibleCard.Root
					key={ step.title }
					className={ clsx( 'jetpack-newsletter-overview__step', {
						'jetpack-newsletter-overview__step--complete': step.complete,
					} ) }
					defaultOpen={ step.defaultOpen }
				>
					<CollapsibleCard.Header className="jetpack-newsletter-overview__step-header">
						<Stack direction="row" align="center" gap="sm">
							<span
								className={ clsx( 'jetpack-newsletter-overview__step-status', {
									'jetpack-newsletter-overview__step-status--complete': step.complete,
								} ) }
								aria-hidden="true"
							>
								{ step.complete ? <Icon icon={ check } size={ 16 } /> : null }
							</span>
							<Card.Title
								className={ clsx( 'jetpack-newsletter-overview__step-title', {
									'jetpack-newsletter-overview__step-title--complete': step.complete,
								} ) }
							>
								{ step.title }
								{ step.complete ? (
									<Text
										render={ <span className="screen-reader-text" /> }
										className="jetpack-newsletter-overview__step-title--complete"
									>
										{ __( 'Complete', 'jetpack-newsletter' ) }
									</Text>
								) : null }
							</Card.Title>
						</Stack>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<Stack direction="column" gap="xl">
							<Text render={ <p /> } className="jetpack-newsletter-overview__step-description">
								{ step.description }
							</Text>
							{ step.primaryAction ? (
								<Stack direction="row" gap="md">
									<Button>{ step.primaryAction }</Button>
									{ step.secondaryAction ? (
										<Button variant="minimal" tone="neutral">
											{ step.secondaryAction }
										</Button>
									) : null }
								</Stack>
							) : null }
						</Stack>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			) ) }
		</Stack>
	);
}
