import { __, sprintf } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { Card, Icon, Link, Stack, Text } from '@wordpress/ui';
import { useEffect, useRef } from 'react';
import { EARN_CHECKLIST, useEarnChecklist } from '../data/launchpad.ts';
import { useMembershipsProducts, useMembershipsStatus } from '../data/memberships.ts';
import { getInitialState } from '../state.ts';
import { recordTracksEvent } from '../tracks.ts';
import { filterEarnTasks } from './tasks.ts';

/**
 * The earn checklist, corrected, and whether there is anything left on it.
 *
 * @return The checklist state.
 */
export function useEarnLaunchpad() {
	const checklist = useEarnChecklist();
	const status = useMembershipsStatus();
	const products = useMembershipsProducts();

	const tasks = filterEarnTasks( checklist.data ?? [], {
		isConnected: status.data?.isConnected ?? false,
		hasProducts: ( products.data?.length ?? 0 ) > 0,
	} );
	const completedSteps = tasks.filter( task => task.completed ).length;

	return {
		isLoading: checklist.isLoading || status.isLoading || products.isLoading,
		shouldShow: tasks.length > 0 && completedSteps < tasks.length,
		tasks,
		completedSteps,
	};
}

/**
 * The earn checklist, shown in place of the earnings until it is done.
 *
 * @param props           - Component props.
 * @param props.launchpad - The checklist state.
 * @return The rendered checklist.
 */
export function EarnLaunchpad( {
	launchpad,
}: {
	launchpad: ReturnType< typeof useEarnLaunchpad >;
} ) {
	const { tasks, completedSteps } = launchpad;
	const { siteIntent } = getInitialState();
	const hasTrackedView = useRef( false );

	useEffect( () => {
		if ( hasTrackedView.current ) {
			return;
		}
		hasTrackedView.current = true;
		recordTracksEvent( 'calypso_launchpad_tasklist_viewed', {
			checklist_slug: EARN_CHECKLIST,
			context: 'earn',
			number_of_steps: tasks.length,
			number_of_completed_steps: completedSteps,
			is_completed: completedSteps === tasks.length,
		} );
	}, [ tasks.length, completedSteps ] );

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="xs">
						<Text variant="body-sm">
							{ sprintf(
								/* translators: 1: steps done, 2: steps in all. */
								__( '%1$d of %2$d steps done', 'jetpack-mu-wpcom' ),
								completedSteps,
								tasks.length
							) }
						</Text>
						<Text variant="heading-lg" render={ <h2 /> }>
							{ siteIntent === 'newsletter'
								? __( 'Create your paid newsletter in two steps.', 'jetpack-mu-wpcom' )
								: __( 'Create your paid offering in two steps.', 'jetpack-mu-wpcom' ) }
						</Text>
						<Text>
							{ __(
								'Let your fans support your art, writing, or project directly.',
								'jetpack-mu-wpcom'
							) }
						</Text>
					</Stack>
					<ul className="wpcom-earn-home__tasks">
						{ tasks.map( task => (
							<li
								key={ task.id }
								className={
									task.completed ? 'wpcom-earn-home__task is-completed' : 'wpcom-earn-home__task'
								}
							>
								{ task.completed ? (
									<Icon icon={ check } />
								) : (
									<span className="wpcom-earn-home__task-marker" />
								) }
								{ task.calypso_path && ! task.disabled ? (
									<Link
										href={ task.calypso_path }
										onClick={ () =>
											recordTracksEvent( 'calypso_launchpad_task_clicked', {
												checklist_slug: EARN_CHECKLIST,
												context: 'earn',
												task_id: task.id,
												is_completed: task.completed,
											} )
										}
									>
										{ task.title }
									</Link>
								) : (
									<Text>{ task.title }</Text>
								) }
							</li>
						) ) }
					</ul>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
