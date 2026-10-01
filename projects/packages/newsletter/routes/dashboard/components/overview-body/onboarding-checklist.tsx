import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { Icon } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import type { JSX } from 'react';

type ChecklistStepId = 'start' | 'customize' | 'write_post' | 'share';

type ChecklistStep = {
	id: ChecklistStepId;
	title: string;
	description: string;
	primaryAction?: string;
	secondaryAction?: string;
	complete?: boolean;
	defaultOpen?: boolean;
};

/**
 * Record a checklist button click.
 *
 * @param step   - Checklist step slug.
 * @param action - Primary action or skip.
 */
function recordChecklistClick( step: ChecklistStepId, action: 'primary' | 'skip' ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_overview_checklist_click', {
		site_type: getSiteType(),
		step,
		action,
	} );
}

/**
 * Checklist action buttons for one step.
 *
 * @param props                 - Action props.
 * @param props.stepId          - Checklist step slug.
 * @param props.primaryAction   - Primary button label.
 * @param props.secondaryAction - Optional skip label.
 * @return The action buttons.
 */
function ChecklistActions( {
	stepId,
	primaryAction,
	secondaryAction,
}: {
	stepId: ChecklistStepId;
	primaryAction: string;
	secondaryAction?: string;
} ): JSX.Element {
	const recordPrimary = useCallback( () => {
		recordChecklistClick( stepId, 'primary' );
	}, [ stepId ] );
	const recordSkip = useCallback( () => {
		recordChecklistClick( stepId, 'skip' );
	}, [ stepId ] );

	return (
		<Stack direction="row" gap="md">
			<Button onClick={ recordPrimary }>{ primaryAction }</Button>
			{ secondaryAction ? (
				<Button variant="minimal" tone="neutral" onClick={ recordSkip }>
					{ secondaryAction }
				</Button>
			) : null }
		</Stack>
	);
}

const STEPS: ChecklistStep[] = [
	{
		id: 'start',
		title: __( 'Start a newsletter', 'jetpack-newsletter' ),
		description: __( 'Your newsletter is ready to welcome subscribers.', 'jetpack-newsletter' ),
		complete: true,
	},
	{
		id: 'customize',
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
		id: 'write_post',
		title: __( 'Write your first post', 'jetpack-newsletter' ),
		description: __( 'Create a post to send your first newsletter email.', 'jetpack-newsletter' ),
		primaryAction: __( 'Write a post', 'jetpack-newsletter' ),
	},
	{
		id: 'share',
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
			{ STEPS.map( step => {
				return (
					<CollapsibleCard.Root
						key={ step.id }
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
									<ChecklistActions
										stepId={ step.id }
										primaryAction={ step.primaryAction }
										secondaryAction={ step.secondaryAction }
									/>
								) : null }
							</Stack>
						</CollapsibleCard.Content>
					</CollapsibleCard.Root>
				);
			} ) }
		</Stack>
	);
}
