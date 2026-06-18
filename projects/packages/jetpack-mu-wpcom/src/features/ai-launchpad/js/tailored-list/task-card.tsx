import { Card, CardBody, Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, published } from '@wordpress/icons';
import clsx from 'clsx';
import { ctaKind, type EnrichedTask } from './model.ts';

interface Props {
	task: EnrichedTask;
	isExpanded: boolean;
	isBusy: boolean;
	canStart: boolean;
	onToggle: () => void;
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
 * A single task in the tailored list, rendered as a card. Completed tasks show
 * a struck-through title with a check-in-circle icon and aren't expandable.
 * Incomplete tasks show a dashed-circle icon, title, and chevron when collapsed;
 * expanding reveals the AI subtitle and the action-specific CTA / "Skip" actions.
 *
 * @param props              - The component props.
 * @param props.task         - The enriched task to render.
 * @param props.isExpanded   - Whether this card is expanded.
 * @param props.isBusy       - Whether the primary action is in flight.
 * @param props.canStart     - Whether the task has an actionable CTA destination.
 * @param props.onToggle     - Called when the collapsed header is clicked.
 * @param props.onGetStarted - Called when the primary CTA is clicked.
 * @param props.onSkip       - Called when "Skip" is clicked.
 * @return The task card element.
 */
export function TaskCard( {
	task,
	isExpanded,
	isBusy,
	canStart,
	onToggle,
	onGetStarted,
	onSkip,
}: Props ) {
	if ( task.completed ) {
		return (
			<Card className="ai-launchpad-tailored-list__card is-completed">
				<CardBody>
					<div className="ai-launchpad-tailored-list__header">
						<Icon icon={ published } className="ai-launchpad-tailored-list__icon is-done" />
						<span className="ai-launchpad-tailored-list__title is-done">{ task.title }</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card className={ clsx( 'ai-launchpad-tailored-list__card', { 'is-expanded': isExpanded } ) }>
			<CardBody>
				<Button
					className="ai-launchpad-tailored-list__header"
					onClick={ onToggle }
					aria-expanded={ isExpanded }
				>
					<span className="ai-launchpad-tailored-list__icon is-todo" aria-hidden="true" />
					<span className="ai-launchpad-tailored-list__title">{ task.title }</span>
					<Icon
						className="ai-launchpad-tailored-list__chevron"
						icon={ isExpanded ? chevronUp : chevronDown }
					/>
				</Button>
				{ isExpanded && (
					<div className="ai-launchpad-tailored-list__body">
						<p className="ai-launchpad-tailored-list__subtitle">{ task.subtitle }</p>
						<div className="ai-launchpad-tailored-list__actions">
							{ canStart && (
								<Button
									variant="primary"
									onClick={ onGetStarted }
									isBusy={ isBusy }
									disabled={ isBusy }
								>
									{ getCtaLabel( task.id ) }
								</Button>
							) }
							<Button variant="tertiary" onClick={ onSkip }>
								{ __( 'Skip', 'jetpack-mu-wpcom' ) }
							</Button>
						</div>
					</div>
				) }
			</CardBody>
		</Card>
	);
}
