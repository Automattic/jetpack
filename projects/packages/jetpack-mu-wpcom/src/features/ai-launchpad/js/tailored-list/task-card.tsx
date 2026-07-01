import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { border, published } from '@wordpress/icons';
import { Button, Card, CollapsibleCard } from '@wordpress/ui';
import { ctaKind, type EnrichedTask } from './model.ts';

interface Props {
	task: EnrichedTask;
	isBusy: boolean;
	canStart: boolean;
	canMarkComplete: boolean;
	isOpen: boolean;
	onOpenChange: ( open: boolean ) => void;
	onGetStarted: () => void;
	onMarkComplete: () => void;
	onSkip: () => void;
}

/**
 * Resolve the action-specific label for a task's primary CTA, keyed first by task
 * id then by {@link ctaKind}, falling back to a generic "Get started".
 *
 * The map lives here rather than in `model.ts` because the labels must be `__()`
 * literals for translation extraction, and `model.ts` is kept free of
 * `@wordpress/*` imports so its node:test suite runs.
 *
 * @param taskId - The catalog task id.
 * @return The translated CTA label.
 */
function getCtaLabel( taskId: string ): string {
	switch ( taskId ) {
		case 'site_theme_selected':
			return __( 'Browse themes', 'jetpack-mu-wpcom' );
		case 'woo_products':
			return __( 'Add products', 'jetpack-mu-wpcom' );
		case 'woo_customize_store':
			return __( 'Customize store', 'jetpack-mu-wpcom' );
		case 'set_up_payments':
			return __( 'Set up payments', 'jetpack-mu-wpcom' );
		case 'connect_social_media':
			return __( 'Connect socials', 'jetpack-mu-wpcom' );
		// Both the AI-selectable id and the deterministic fallback id, so the label
		// holds on the fallback path too.
		case 'subscribers_added':
		case 'add_10_email_subscribers':
			return __( 'Add subscribers', 'jetpack-mu-wpcom' );
	}

	switch ( ctaKind( taskId ) ) {
		case 'first_post':
			return __( 'Write post', 'jetpack-mu-wpcom' );
		case 'pattern_page':
			return __( 'Add page', 'jetpack-mu-wpcom' );
		case 'launch':
			return __( 'Launch site', 'jetpack-mu-wpcom' );
		default:
			return __( 'Get started', 'jetpack-mu-wpcom' );
	}
}

/**
 * A single task in the tailored list. Completed tasks render as a plain card with
 * a struck-through title and aren't expandable. Incomplete tasks render as a
 * `CollapsibleCard` that expands to reveal the subtitle and the CTA / "Skip"
 * actions. Open state is controlled by the parent so the list acts as an accordion.
 *
 * @param props                 - The component props.
 * @param props.task            - The enriched task to render.
 * @param props.isBusy          - Whether the primary action is in flight.
 * @param props.canStart        - Whether the task has an actionable CTA destination.
 * @param props.canMarkComplete - Whether the task offers a "Mark as complete" button
 *                              (a complete-on-click task with no CTA destination).
 * @param props.isOpen          - Whether the card is expanded (controlled by the parent).
 * @param props.onOpenChange    - Called with the requested open state when the header
 *                              is toggled, so the parent can enforce single-open.
 * @param props.onGetStarted    - Called when the primary CTA is clicked.
 * @param props.onMarkComplete  - Called when "Mark as complete" is clicked.
 * @param props.onSkip          - Called when "Skip" is clicked.
 * @return The task card element.
 */
export function TaskCard( {
	task,
	isBusy,
	canStart,
	canMarkComplete,
	isOpen,
	onOpenChange,
	onGetStarted,
	onMarkComplete,
	onSkip,
}: Props ) {
	if ( task.completed ) {
		return (
			<Card.Root className="ai-launchpad-tailored-list__card is-completed">
				<Card.Header>
					<span className="ai-launchpad-tailored-list__header-inner">
						<span className="ai-launchpad-tailored-list__icon is-done">
							<Icon icon={ published } size={ 24 } />
						</span>
						<span className="ai-launchpad-tailored-list__title is-done">{ task.title }</span>
					</span>
				</Card.Header>
			</Card.Root>
		);
	}

	return (
		<CollapsibleCard.Root
			className="ai-launchpad-tailored-list__card"
			open={ isOpen }
			onOpenChange={ onOpenChange }
		>
			<CollapsibleCard.Header>
				<span className="ai-launchpad-tailored-list__header-inner">
					<span className="ai-launchpad-tailored-list__icon is-todo">
						<Icon icon={ border } size={ 24 } />
					</span>
					<span className="ai-launchpad-tailored-list__title">{ task.title }</span>
				</span>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<p className="ai-launchpad-tailored-list__subtitle">{ task.subtitle }</p>
				<div className="ai-launchpad-tailored-list__actions">
					{ canStart && (
						<Button variant="solid" onClick={ onGetStarted } loading={ isBusy } disabled={ isBusy }>
							{ getCtaLabel( task.id ) }
						</Button>
					) }
					{ ! canStart && canMarkComplete && (
						<Button
							variant="solid"
							onClick={ onMarkComplete }
							loading={ isBusy }
							disabled={ isBusy }
						>
							{ __( 'Mark as complete', 'jetpack-mu-wpcom' ) }
						</Button>
					) }
					<Button variant="minimal" tone="neutral" onClick={ onSkip }>
						{ __( 'Skip', 'jetpack-mu-wpcom' ) }
					</Button>
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
