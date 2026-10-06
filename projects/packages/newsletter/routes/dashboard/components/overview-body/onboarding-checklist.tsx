import analytics from '@automattic/jetpack-analytics';
import { getSiteData, getSiteType } from '@automattic/jetpack-script-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@wordpress/components';
import { flushSync, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import {
	Button,
	Card,
	CollapsibleCard,
	LinkButton,
	Skeleton,
	Spinner,
	Stack,
	Text,
	VisuallyHidden,
} from '@wordpress/ui';
import clsx from 'clsx';
import {
	completeOnboardingTask,
	fetchOnboardingTasks,
	isStoredListComplete,
	ONBOARDING_TASK_IDS,
	ONBOARDING_TASKS_QUERY_KEY,
	type OnboardingTaskId,
	type OnboardingTaskList,
} from './task-list-api';
import type { JSX } from 'react';

type ChecklistStep = {
	id: OnboardingTaskId;
	title: string;
	description: string;
	primaryAction?: string;
};

/**
 * Record a checklist button click.
 *
 * @param step   - Checklist step slug.
 * @param action - Primary action or skip.
 */
function recordChecklistClick( step: OnboardingTaskId, action: 'primary' | 'skip' ): void {
	analytics.tracks.recordEvent( 'jetpack_newsletter_overview_checklist_click', {
		site_type: getSiteType(),
		step,
		action,
	} );
}

/**
 * Checklist action buttons for one open step.
 *
 * The subscribe form and subscribers steps switch to their dashboard tab; the send step opens a new
 * post in the editor. Skip completes the step for good.
 *
 * @param props               - Action props.
 * @param props.stepId        - Checklist step slug.
 * @param props.primaryAction - Primary button label.
 * @param props.isSkipping    - Whether this step's Skip request is in flight.
 * @param props.onSkip        - Complete the step by hand.
 * @return The action buttons.
 */
function ChecklistActions( {
	stepId,
	primaryAction,
	isSkipping,
	onSkip,
}: {
	stepId: OnboardingTaskId;
	primaryAction: string;
	isSkipping: boolean;
	onSkip: ( stepId: OnboardingTaskId ) => void;
} ): JSX.Element {
	const navigate = useNavigate();

	const handlePrimary = useCallback( () => {
		recordChecklistClick( stepId, 'primary' );
		if ( stepId === 'subscribe_form' || stepId === 'subscribers' ) {
			// SAFETY: This is the dashboard's complete search state, but generated route types are unavailable.
			navigate( {
				search: {
					tab: stepId === 'subscribe_form' ? 'settings' : 'subscribers',
					subscriber: undefined,
					u: undefined,
				},
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		}
	}, [ navigate, stepId ] );

	const handleSkip = useCallback( () => {
		recordChecklistClick( stepId, 'skip' );
		onSkip( stepId );
	}, [ onSkip, stepId ] );

	return (
		<Stack direction="row" gap="md">
			{ stepId === 'send_newsletter' ? (
				<LinkButton
					href={ `${ getSiteData()?.admin_url ?? '' }post-new.php` }
					onClick={ handlePrimary }
				>
					{ primaryAction }
				</LinkButton>
			) : (
				<Button onClick={ handlePrimary }>{ primaryAction }</Button>
			) }
			<Button variant="minimal" tone="neutral" onClick={ handleSkip } disabled={ isSkipping }>
				{ __( 'Skip', 'jetpack-newsletter' ) }
			</Button>
		</Stack>
	);
}

const STEPS: ChecklistStep[] = [
	{
		id: 'start',
		title: __( 'Start a newsletter', 'jetpack-newsletter' ),
		description: __(
			"Your site has a newsletter built in. When you publish a post, it's automatically emailed to your subscribers.",
			'jetpack-newsletter'
		),
	},
	{
		id: 'subscribe_form',
		title: __( 'Add a subscribe form to your site', 'jetpack-newsletter' ),
		description: __(
			'Give visitors a way to subscribe: a form at the end of your posts, a pop-up, or a floating button.',
			'jetpack-newsletter'
		),
		primaryAction: __( 'Add a subscribe form', 'jetpack-newsletter' ),
	},
	{
		id: 'subscribers',
		title: __( 'Get your first 3 subscribers', 'jetpack-newsletter' ),
		description: __(
			"Invite friends, family, or readers you already have. Don't have anyone to add? Find other writers to read and subscribe, like, or comment. It's one of the best ways to find your first readers.",
			'jetpack-newsletter'
		),
		primaryAction: __( 'Add subscribers', 'jetpack-newsletter' ),
	},
	{
		id: 'send_newsletter',
		title: __( 'Send your first newsletter', 'jetpack-newsletter' ),
		description: __(
			"Write a new post and publish it with email turned on. Posts you've already published won't be sent. Send yourself a test first to see what your subscribers get.",
			'jetpack-newsletter'
		),
		primaryAction: __( 'Write a post', 'jetpack-newsletter' ),
	},
];

/**
 * Render the checklist steps.
 *
 * The cards are uncontrolled, so the step opened by default is decided once, when they mount:
 * steps completed later (by a refresh from WP.com, or by Skip) keep whatever open state the
 * visitor left them in.
 *
 * @param props              - Steps props.
 * @param props.completed    - Ids of the completed steps.
 * @param props.isRefreshing - Whether WP.com is being asked for a fresher list.
 * @param props.skippingStep - Step whose Skip request is in flight, if any.
 * @param props.onSkip       - Complete a step by hand.
 * @return The checklist steps.
 */
function ChecklistSteps( {
	completed,
	isRefreshing,
	skippingStep,
	onSkip,
}: {
	completed: Set< OnboardingTaskId >;
	isRefreshing: boolean;
	skippingStep?: OnboardingTaskId;
	onSkip: ( stepId: OnboardingTaskId ) => void;
} ): JSX.Element {
	const [ firstOpenStep ] = useState( () => STEPS.find( step => ! completed.has( step.id ) )?.id );
	const completedKey = STEPS.filter( step => completed.has( step.id ) )
		.map( step => step.id )
		.join();
	const spinnerKey = STEPS.filter(
		step => ! completed.has( step.id ) && ( isRefreshing || step.id === skippingStep )
	)
		.map( step => step.id )
		.join();
	const [ shown, setShown ] = useState( { completedKey, spinnerKey } );

	// Applying changes inside a view transition fades steps and spinners instead of cutting them.
	useEffect( () => {
		if ( shown.completedKey === completedKey && shown.spinnerKey === spinnerKey ) {
			return;
		}
		const next = { completedKey, spinnerKey };
		if ( ! document.startViewTransition ) {
			setShown( next );
			return;
		}
		// Another view transition (e.g. a route change) aborts this one; that's fine.
		document
			.startViewTransition( () => flushSync( () => setShown( next ) ) )
			.ready.catch( () => {} );
	}, [ completedKey, spinnerKey, shown ] );
	const shownCompleted = new Set( shown.completedKey.split( ',' ) );
	const shownSpinners = new Set( shown.spinnerKey.split( ',' ) );

	return (
		<Stack
			direction="column"
			gap="sm"
			className="jetpack-newsletter-overview__checklist"
			aria-busy={ isRefreshing }
		>
			{ isRefreshing ? (
				<VisuallyHidden role="status">
					{ __( 'Updating checklist…', 'jetpack-newsletter' ) }
				</VisuallyHidden>
			) : null }
			{ STEPS.map( step => {
				const complete = shownCompleted.has( step.id );
				return (
					<CollapsibleCard.Root
						key={ step.id }
						className={ clsx( 'jetpack-newsletter-overview__step', {
							'jetpack-newsletter-overview__step--complete': complete,
						} ) }
						defaultOpen={ step.id === firstOpenStep }
						style={ { viewTransitionName: `jetpack-newsletter-step-${ step.id }` } }
					>
						<CollapsibleCard.Header className="jetpack-newsletter-overview__step-header">
							<Stack direction="row" align="center" gap="sm">
								<span
									className={ clsx( 'jetpack-newsletter-overview__step-status', {
										'jetpack-newsletter-overview__step-status--complete': complete,
									} ) }
									aria-hidden="true"
								>
									{ complete ? <Icon icon={ check } size={ 16 } /> : null }
								</span>
								<Card.Title
									className={ clsx( 'jetpack-newsletter-overview__step-title', {
										'jetpack-newsletter-overview__step-title--complete': complete,
									} ) }
								>
									{ step.title }
									{ complete ? (
										<Text
											render={ <span className="screen-reader-text" /> }
											className="jetpack-newsletter-overview__step-title--complete"
										>
											{ __( 'Complete', 'jetpack-newsletter' ) }
										</Text>
									) : null }
								</Card.Title>
								{ shownSpinners.has( step.id ) ? (
									<Spinner
										aria-hidden="true"
										className="jetpack-newsletter-overview__step-spinner"
										style={ { viewTransitionName: `jetpack-newsletter-step-spinner-${ step.id }` } }
									/>
								) : null }
							</Stack>
						</CollapsibleCard.Header>
						<CollapsibleCard.Content>
							<Stack direction="column" gap="xl">
								<Text render={ <p /> } className="jetpack-newsletter-overview__step-description">
									{ step.description }
								</Text>
								{ step.primaryAction && ! complete ? (
									<ChecklistActions
										stepId={ step.id }
										primaryAction={ step.primaryAction }
										isSkipping={ skippingStep === step.id }
										onSkip={ onSkip }
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

/**
 * Placeholder for the checklist while WP.com is first asked for it.
 *
 * @return The checklist skeleton.
 */
function ChecklistSkeleton(): JSX.Element {
	return (
		<Stack
			direction="column"
			gap="sm"
			className="jetpack-newsletter-overview__checklist"
			role="status"
			aria-busy="true"
		>
			<VisuallyHidden>{ __( 'Loading checklist…', 'jetpack-newsletter' ) }</VisuallyHidden>
			{ STEPS.map( step => (
				<Card.Root
					key={ step.id }
					className="jetpack-newsletter-overview__step jetpack-newsletter-overview__step--loading"
				>
					<Skeleton className="jetpack-newsletter-overview__step-skeleton" />
				</Card.Root>
			) ) }
		</Stack>
	);
}

/**
 * Render the Newsletter onboarding checklist.
 *
 * Completion comes from WP.com, which checks each step and stores it once done. Every visit asks
 * WP.com again, showing the last list it returned meanwhile; only a fully complete list is kept in
 * localStorage, since it can never reopen. If the task list can't be loaded, the steps read as
 * open and can still be skipped.
 *
 * @return The onboarding checklist.
 */
export default function OnboardingChecklist(): JSX.Element {
	const queryClient = useQueryClient();
	const [ storedComplete ] = useState( isStoredListComplete );
	const tasksQuery = useQuery( {
		queryKey: ONBOARDING_TASKS_QUERY_KEY,
		queryFn: fetchOnboardingTasks,
		enabled: ! storedComplete,
		// Steps complete outside this screen, so ask again on every visit despite the cached list.
		refetchOnMount: 'always',
	} );
	const skipMutation = useMutation( {
		mutationFn: completeOnboardingTask,
		onSuccess: ( taskList: OnboardingTaskList ) => {
			queryClient.setQueryData( ONBOARDING_TASKS_QUERY_KEY, taskList );
		},
	} );
	const { mutate: skip } = skipMutation;
	const handleSkip = useCallback( ( stepId: OnboardingTaskId ) => skip( stepId ), [ skip ] );

	// Without a list, wait for WP.com so the first open step is the one opened by default.
	if ( ! storedComplete && tasksQuery.isPending ) {
		return <ChecklistSkeleton />;
	}

	const completed = new Set< OnboardingTaskId >(
		storedComplete ? ONBOARDING_TASK_IDS : [ 'start' ]
	);
	tasksQuery.data?.tasks.forEach( task => {
		if ( task.complete ) {
			completed.add( task.id );
		}
	} );

	return (
		<ChecklistSteps
			completed={ completed }
			isRefreshing={ tasksQuery.isFetching }
			skippingStep={ skipMutation.isPending ? skipMutation.variables : undefined }
			onSkip={ handleSkip }
		/>
	);
}
