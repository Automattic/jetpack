import { __ } from '@wordpress/i18n';
import { Button, Card, CollapsibleCard } from '@wordpress/ui';
import { ctaKind, type EnrichedTask } from './model.ts';

// WPDS doesn't ship a "todo / dashed-circle" or "check-in-circle" icon yet (only
// `check`), so we inline both. Sized at 24px to line up with each other;
// `currentColor` lets us tone them via CSS.
const taskActiveIcon = (
	<svg
		className="ai-launchpad-tailored-list__icon is-todo"
		width={ 24 }
		height={ 24 }
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2.5" />
	</svg>
);

const taskDoneIcon = (
	<svg
		className="ai-launchpad-tailored-list__icon is-done"
		width={ 24 }
		height={ 24 }
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
		<path
			d="M8 12.5L11 15.5L16 9.5"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</svg>
);

interface Props {
	task: EnrichedTask;
	isBusy: boolean;
	canStart: boolean;
	defaultOpen: boolean;
	onGetStarted: () => void;
	onSkip: () => void;
}

/**
 * Resolve the action-specific label for a task's primary CTA. A static,
 * translatable map keyed first by task id (the most specific) then by
 * {@link ctaKind} (the behavioral class), falling back to a generic
 * "Get started" so a task with no entry still gets a sensible button.
 *
 * The map lives here rather than in `model.ts` because the labels must be
 * `__()` literals (so they're extracted for translation) and `model.ts` is
 * intentionally free of `@wordpress/*` imports so its node:test suite runs.
 * Labels are AI-independent on purpose — AI output is English-only today
 * (DOTOBRD-474), so deriving labels from it would regress i18n.
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
		// Both the AI-selectable catalog id and the deterministic fallback id for
		// growing a subscriber list, so the label holds on the fallback path too.
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
 * A single task in the tailored list. Completed tasks render as a plain card
 * with a struck-through title and a check-in-circle icon, and aren't expandable.
 * Incomplete tasks render as a `CollapsibleCard` (dashed-circle icon + title in
 * the always-visible header, which is the toggle trigger); expanding reveals the
 * AI subtitle and the action-specific CTA / "Skip" actions.
 *
 * @param props              - The component props.
 * @param props.task         - The enriched task to render.
 * @param props.isBusy       - Whether the primary action is in flight.
 * @param props.canStart     - Whether the task has an actionable CTA destination.
 * @param props.defaultOpen  - Whether the card starts expanded (uncontrolled, so
 *                           the user can then collapse it without it reopening).
 * @param props.onGetStarted - Called when the primary CTA is clicked.
 * @param props.onSkip       - Called when "Skip" is clicked.
 * @return The task card element.
 */
export function TaskCard( { task, isBusy, canStart, defaultOpen, onGetStarted, onSkip }: Props ) {
	if ( task.completed ) {
		return (
			<Card.Root className="ai-launchpad-tailored-list__card is-completed">
				<Card.Header>
					<span className="ai-launchpad-tailored-list__header-inner">
						{ taskDoneIcon }
						<span className="ai-launchpad-tailored-list__title is-done">{ task.title }</span>
					</span>
				</Card.Header>
			</Card.Root>
		);
	}

	return (
		<CollapsibleCard.Root className="ai-launchpad-tailored-list__card" defaultOpen={ defaultOpen }>
			<CollapsibleCard.Header>
				<span className="ai-launchpad-tailored-list__header-inner">
					{ taskActiveIcon }
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
					<Button variant="minimal" tone="neutral" onClick={ onSkip }>
						{ __( 'Skip', 'jetpack-mu-wpcom' ) }
					</Button>
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
