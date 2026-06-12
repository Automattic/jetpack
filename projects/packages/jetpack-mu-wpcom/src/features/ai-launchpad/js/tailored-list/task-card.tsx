import { Card, CardBody, Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check, chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import type { EnrichedTask } from './model.ts';

interface Props {
	task: EnrichedTask;
	isExpanded: boolean;
	isBusy: boolean;
	onToggle: () => void;
	onGetStarted: () => void;
	onSkip: () => void;
}

/**
 * A single task in the tailored list, rendered as a card. Completed tasks show
 * a struck-through title with a check icon and aren't expandable. Incomplete
 * tasks show a title + chevron when collapsed; expanding reveals the AI
 * subtitle and the "Get started" / "Skip" actions.
 *
 * @param props              - The component props.
 * @param props.task         - The enriched task to render.
 * @param props.isExpanded   - Whether this card is expanded.
 * @param props.isBusy       - Whether the "Get started" action is in flight.
 * @param props.onToggle     - Called when the collapsed header is clicked.
 * @param props.onGetStarted - Called when "Get started" is clicked.
 * @param props.onSkip       - Called when "Skip" is clicked.
 * @return The task card element.
 */
export function TaskCard( { task, isExpanded, isBusy, onToggle, onGetStarted, onSkip }: Props ) {
	if ( task.completed ) {
		return (
			<Card className="ai-launchpad-tailored-list__card is-completed">
				<CardBody>
					<div className="ai-launchpad-tailored-list__header">
						<Icon icon={ check } className="ai-launchpad-tailored-list__icon is-done" />
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
					<span className="ai-launchpad-tailored-list__title">{ task.title }</span>
					<Icon icon={ isExpanded ? chevronUp : chevronDown } />
				</Button>
				{ isExpanded && (
					<div className="ai-launchpad-tailored-list__body">
						<p className="ai-launchpad-tailored-list__subtitle">{ task.subtitle }</p>
						<div className="ai-launchpad-tailored-list__actions">
							<Button
								variant="primary"
								onClick={ onGetStarted }
								isBusy={ isBusy }
								disabled={ isBusy }
							>
								{ __( 'Get started', 'jetpack-mu-wpcom' ) }
							</Button>
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
