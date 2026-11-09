import { border, drafts, error, lock, published } from '@wordpress/icons';
import { CollapsibleCard, Icon, Stack, Text } from '@wordpress/ui';
import { isComplete } from './model';
import type { TaskId, TaskState } from './model';
import type { ReactNode } from 'react';

type Props = {
	id: TaskId;
	state: TaskState;
	title: string;
	/** State on the header's inline end: a Badge, a Spinner or short text. Never a control. */
	headerEnd?: ReactNode;
	/** The state is a long value (an address) that can be cut short rather than wrap the title. */
	headerEndShrinks?: boolean;
	/** The line under the title once the card opens. */
	subtitle?: ReactNode;
	open: boolean;
	onOpenChange: ( open: boolean ) => void;
	children?: ReactNode;
};

/**
 * The DOM id of a task card, for moving focus to its header.
 *
 * @param id - Task id.
 * @return The element id.
 */
export function taskCardId( id: TaskId ): string {
	return `jetpack-send-setup-${ id }`;
}

/**
 * Move focus to a task card's header, the element that opens and closes it.
 *
 * @param id - Task id.
 */
export function focusTaskCard( id: TaskId ): void {
	document
		.getElementById( taskCardId( id ) )
		?.querySelector< HTMLElement >( '[aria-expanded]' )
		?.focus();
}

/**
 * The glyph for a task's state.
 *
 * @param state - Task state.
 * @return The icon.
 */
function stateIcon( state: TaskState ) {
	if ( state === 'locked' ) {
		return lock;
	}
	if ( state === 'needs_fix' || state === 'failed' ) {
		return error;
	}
	if ( isComplete( state ) ) {
		return published;
	}
	return state === 'waiting' || state === 'no_answer' ? drafts : border;
}

/**
 * One setup task, kept collapsible when done so it can show what was set.
 *
 * @param props                  - Component props.
 * @param props.id               - Task id.
 * @param props.state            - Task state.
 * @param props.title            - Title.
 * @param props.headerEnd        - State shown on the header's inline end.
 * @param props.headerEndShrinks - The state can be cut short to keep the header on one line.
 * @param props.subtitle         - The line under the title.
 * @param props.open             - Whether the card is open (the parent keeps one open).
 * @param props.onOpenChange     - Asks the parent to open or close it.
 * @param props.children         - The body.
 * @return The card.
 */
const TaskCard = ( {
	id,
	state,
	title,
	headerEnd,
	headerEndShrinks = false,
	subtitle,
	open,
	onOpenChange,
	children,
}: Props ) => {
	const done = isComplete( state );
	const classes = [ 'jetpack-send-setup__card' ];
	if ( state === 'locked' ) {
		classes.push( 'is-disabled' );
	} else if ( done ) {
		classes.push( 'is-completed' );
	} else if ( state === 'needs_fix' || state === 'failed' ) {
		classes.push( 'is-error' );
	}

	return (
		<CollapsibleCard.Root
			id={ taskCardId( id ) }
			className={ classes.join( ' ' ) }
			open={ open }
			onOpenChange={ onOpenChange }
		>
			<CollapsibleCard.Header render={ <h3 /> }>
				<Stack direction="row" align="center" justify="space-between" gap="md">
					<Stack
						render={ <span /> }
						align="center"
						gap="sm"
						className="jetpack-send-setup__task-heading"
					>
						<span className="jetpack-send-setup__icon">
							<Icon icon={ stateIcon( state ) } />
						</span>
						<Text variant="heading-lg" className="jetpack-send-setup__title">
							{ title }
						</Text>
					</Stack>
					{ headerEnd && (
						<CollapsibleCard.HeaderDescription
							className={
								headerEndShrinks
									? 'jetpack-send-setup__header-end is-shrinkable'
									: 'jetpack-send-setup__header-end'
							}
						>
							{ headerEnd }
						</CollapsibleCard.HeaderDescription>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				{ subtitle && (
					<Text variant="body-lg" render={ <p /> } className="jetpack-send-setup__subtitle">
						{ subtitle }
					</Text>
				) }
				{ children }
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default TaskCard;
