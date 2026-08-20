import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { border, drafts, lock, published } from '@wordpress/icons';
import { Button, Card, CollapsibleCard } from '@wordpress/ui';
import { ctaKind, type CtaKind, type EnrichedTask } from './model.ts';

interface Props {
	task: EnrichedTask;
	isBusy: boolean;
	isLocked: boolean;
	canStart: boolean;
	canMarkComplete: boolean;
	isOpen: boolean;
	onOpenChange: ( open: boolean ) => void;
	// Fired when a completed/skipped card — which cannot expand — is clicked, so
	// reopen-attempts are still observable. Collapsible cards report through
	// onOpenChange instead.
	onCollapsedClick: () => void;
	onGetStarted: () => void;
	onMarkComplete: () => void;
	onSkip: () => void;
}

/**
 * The CTA label for every {@link CtaKind}, including the `deeplink` catch-all.
 *
 * A `Record` keyed by the union rather than a `switch` with a `default`, so that adding a kind
 * without labelling it is a compile error. As a switch it was neither: a missing arm fell through to
 * the generic "Get started" silently, and no test could see it — the labels can't be asserted from
 * `model.test.mts`, because reaching them means importing `@wordpress/*`, which the node:test runner
 * can't load. That is also why the map lives here and not in `model.ts`: the labels must be `__()`
 * literals for translation extraction, and `model.ts` is kept import-free so its suite runs.
 *
 * Thunks rather than plain strings, so each `__()` still runs at render time — a module-scope call
 * would resolve before the locale data is in place.
 */
const CTA_KIND_LABELS: Record< CtaKind, () => string > = {
	first_post: () => __( 'Write post', 'jetpack-mu-wpcom' ),
	about_page: () => __( 'Add page', 'jetpack-mu-wpcom' ),
	gallery_page: () => __( 'Create gallery', 'jetpack-mu-wpcom' ),
	contact_page: () => __( 'Add contact page', 'jetpack-mu-wpcom' ),
	events_page: () => __( 'Add events page', 'jetpack-mu-wpcom' ),
	video_page: () => __( 'Add video page', 'jetpack-mu-wpcom' ),
	portfolio_piece: () => __( 'Add portfolio piece', 'jetpack-mu-wpcom' ),
	launch: () => __( 'Launch site', 'jetpack-mu-wpcom' ),
	deeplink: () => __( 'Get started', 'jetpack-mu-wpcom' ),
};

/**
 * Resolve the action-specific label for a task's primary CTA, keyed first by task
 * id then by {@link ctaKind}.
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
		// `add_gallery_page` is not listed here: it is the only id of its kind, so the
		// `gallery_page` entry in CTA_KIND_LABELS carries its label and this arm would be dead.
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
		// The subscriber tasks all share this label: the menu id (import_subscribers), the
		// deterministic-fallback id (add_10_email_subscribers), and the pre-remap alias
		// (subscribers_added), which can still surface via the in-memory fixture fallback.
		case 'import_subscribers':
		case 'subscribers_added':
		case 'add_10_email_subscribers':
			return __( 'Add subscribers', 'jetpack-mu-wpcom' );
	}

	return CTA_KIND_LABELS[ ctaKind( taskId ) ]();
}

/**
 * A single task in the tailored list. Completed tasks render as a plain card with
 * a struck-through title and aren't expandable. Incomplete tasks render as a
 * `CollapsibleCard` that expands to reveal the subtitle and the CTA / "Skip"
 * actions. Open state is controlled by the parent so the list acts as an accordion.
 *
 * @param props                  - The component props.
 * @param props.task             - The enriched task to render.
 * @param props.isBusy           - Whether this card's action is in flight (spinner).
 * @param props.isLocked         - Whether any card's action is in flight; disables all
 *                               actions so concurrent writes can't interleave.
 * @param props.canStart         - Whether the task has an actionable CTA destination.
 * @param props.canMarkComplete  - Whether the task offers a "Mark as complete" button
 *                               (a complete-on-click task with no CTA destination).
 * @param props.isOpen           - Whether the card is expanded (controlled by the parent).
 * @param props.onOpenChange     - Called with the requested open state when the header
 *                               is toggled, so the parent can enforce single-open.
 * @param props.onCollapsedClick - Called when a completed/skipped (non-expandable)
 *                               card is clicked, for analytics.
 * @param props.onGetStarted     - Called when the primary CTA is clicked.
 * @param props.onMarkComplete   - Called when "Mark as complete" is clicked.
 * @param props.onSkip           - Called when "Skip" is clicked.
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
	onCollapsedClick,
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
			// Analytics-only click listener: the card stays non-interactive (no role or
			// keyboard affordance) — it just observes users trying to reopen a done card.
			<Card.Root
				className="ai-launchpad-tailored-list__card is-completed"
				onClick={ onCollapsedClick }
			>
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
