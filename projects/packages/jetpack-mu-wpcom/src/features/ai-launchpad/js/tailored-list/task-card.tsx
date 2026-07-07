import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { border, drafts, lock, published } from '@wordpress/icons';
import { Button, Card, CollapsibleCard } from '@wordpress/ui';
import { ctaKind, type EnrichedTask } from './model.ts';

interface Props {
	task: EnrichedTask;
	isBusy: boolean;
	isLocked: boolean;
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
 * @param taskId     - The catalog task id.
 * @param inProgress - Whether the task has a saved-but-unpublished draft.
 * @return The translated CTA label.
 */
function getCtaLabel( taskId: string, inProgress: boolean ): string {
	// The install task's in-progress state means "installed but inactive", so its CTA activates the plugin rather
	// than resuming a draft.
	if ( inProgress && taskId === 'install_woocommerce' ) {
		return __( 'Activate WooCommerce', 'jetpack-mu-wpcom' );
	}

	// An in-progress task reopens its existing draft, so the CTA invites the user to pick up where they left off.
	if ( inProgress ) {
		return __( 'Continue', 'jetpack-mu-wpcom' );
	}

	switch ( taskId ) {
		case 'site_theme_selected':
			return __( 'Browse themes', 'jetpack-mu-wpcom' );
		case 'add_gallery_page':
			return __( 'Create gallery', 'jetpack-mu-wpcom' );
		case 'install_woocommerce':
			return __( 'Install WooCommerce', 'jetpack-mu-wpcom' );
		case 'setup_woocommerce_store':
			return __( 'Set up store', 'jetpack-mu-wpcom' );
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
 * @param props.isBusy          - Whether this card's action is in flight (spinner).
 * @param props.isLocked        - Whether any card's action is in flight; disables all
 *                              actions so concurrent writes can't interleave.
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
	isLocked,
	canStart,
	canMarkComplete,
	isOpen,
	onOpenChange,
	onGetStarted,
	onMarkComplete,
	onSkip,
}: Props ) {
	// A disabled task is a locked preview of a task that isn't reachable yet (a sell site's
	// commerce tasks before WooCommerce is active). It still expands to its subtitle, but
	// shows a lock glyph and a hint in place of any CTA / Skip actions. Checked before
	// `completed` so a stale completion flag can never render it as a struck-through "done".
	if ( task.disabled ) {
		return (
			<CollapsibleCard.Root
				className="ai-launchpad-tailored-list__card is-disabled"
				open={ isOpen }
				onOpenChange={ onOpenChange }
			>
				<CollapsibleCard.Header>
					<span className="ai-launchpad-tailored-list__header-inner">
						<span className="ai-launchpad-tailored-list__icon">
							<Icon icon={ lock } size={ 24 } />
						</span>
						<span className="ai-launchpad-tailored-list__title">{ task.title }</span>
					</span>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<p className="ai-launchpad-tailored-list__subtitle">{ task.subtitle }</p>
					<p className="ai-launchpad-tailored-list__hint">
						{ __( 'Available once WooCommerce is active.', 'jetpack-mu-wpcom' ) }
					</p>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		);
	}

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
					<span className="ai-launchpad-tailored-list__icon">
						{ /* To-do vs in-progress is conveyed by the glyph alone; both share the neutral color. */ }
						<Icon icon={ task.in_progress ? drafts : border } size={ 24 } />
					</span>
					<span className="ai-launchpad-tailored-list__title">{ task.title }</span>
				</span>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<p className="ai-launchpad-tailored-list__subtitle">{ task.subtitle }</p>
				<div className="ai-launchpad-tailored-list__actions">
					{ canStart && (
						<Button
							variant="solid"
							onClick={ onGetStarted }
							loading={ isBusy }
							disabled={ isLocked }
						>
							{ getCtaLabel( task.id, task.in_progress ) }
						</Button>
					) }
					{ ! canStart && canMarkComplete && (
						<Button
							variant="solid"
							onClick={ onMarkComplete }
							loading={ isBusy }
							disabled={ isLocked }
						>
							{ __( 'Mark as complete', 'jetpack-mu-wpcom' ) }
						</Button>
					) }
					{ /* Skip persists a server write too, so it shares the lock with the primary action. */ }
					<Button variant="minimal" tone="neutral" onClick={ onSkip } disabled={ isLocked }>
						{ __( 'Skip', 'jetpack-mu-wpcom' ) }
					</Button>
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
