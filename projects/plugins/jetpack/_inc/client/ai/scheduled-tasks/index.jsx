import { Button, Modal, Spinner } from '@wordpress/components';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useScheduledTasks } from './use-scheduled-tasks';

const INITIAL_VIEW = {
	type: 'table',
	fields: [ 'scheduled', 'latest_run' ],
	titleField: 'task',
	showMedia: false,
	page: 1,
	perPage: 20,
	sort: { field: 'task', direction: 'asc' },
	search: '',
	filters: [],
};

const STATUS_CHANGE_NOTICES = {
	active: __( 'The task was resumed.', 'jetpack' ),
	paused: __( 'The task was paused.', 'jetpack' ),
};

const openNewAgentChat = () => {
	const open = () => {
		const actions = window.__agentsManagerActions;
		const isReady = actions?.isReady;
		if (
			! actions ||
			( typeof isReady === 'function' && isReady() === false ) ||
			isReady === false
		) {
			return false;
		}
		actions.chatNavigate?.( '/' );
		actions.setChatDocked?.( true );
		actions.setChatOpen?.( true );
		return true;
	};
	if ( ! open() ) {
		window.addEventListener( 'agents-manager-ready', open, { once: true } );
	}
};

const relativeDate = value => {
	if ( ! value ) {
		return '—';
	}
	const delta = new Date( value ).getTime() - Date.now();
	const absolute = Math.abs( delta );
	let divisor = 60000;
	let unit = 'minute';
	if ( absolute >= 86400000 ) {
		divisor = 86400000;
		unit = 'day';
	} else if ( absolute >= 3600000 ) {
		divisor = 3600000;
		unit = 'hour';
	}
	return new Intl.RelativeTimeFormat( undefined, { numeric: 'auto' } ).format(
		Math.round( delta / divisor ),
		unit
	);
};

const recurrenceLabel = task => {
	if ( task.next_run_at ) {
		return relativeDate( task.next_run_at );
	}
	const type = task.recurrence?.type;
	return (
		{
			daily: __( 'Daily', 'jetpack' ),
			weekly: __( 'Weekly', 'jetpack' ),
			monthly: __( 'Monthly', 'jetpack' ),
			one_time: __( 'One time', 'jetpack' ),
		}[ type ] || '—'
	);
};

const SafeSummary = ( { text } ) => {
	if ( ! text ) {
		return <span>—</span>;
	}
	return (
		<p className="jetpack-ai-scheduled-tasks__summary">
			{ text.split( /(https?:\/\/[^\s]+)/g ).map( ( part, index ) =>
				/^https?:\/\//.test( part ) ? (
					<a key={ index } href={ part } target="_blank" rel="noopener noreferrer">
						{ part }
					</a>
				) : (
					part
				)
			) }
		</p>
	);
};

/**
 * Task details modal.
 *
 * @param {object}   props         - Component props.
 * @param {object}   props.task    - Scheduled task to display.
 * @param {Function} props.onClose - Close callback.
 * @return {object} Task detail UI.
 */
function TaskDetail( { task, onClose } ) {
	return (
		<Modal
			title={ task.title }
			onRequestClose={ onClose }
			className="jetpack-ai-scheduled-tasks__detail"
		>
			<dl>
				<dt>{ __( 'Status', 'jetpack' ) }</dt>
				<dd>{ task.status }</dd>
				<dt>{ __( 'Scheduled', 'jetpack' ) }</dt>
				<dd>{ recurrenceLabel( task ) }</dd>
				<dt>{ __( 'Timezone', 'jetpack' ) }</dt>
				<dd>{ task.recurrence?.timezone || 'UTC' }</dd>
				<dt>{ __( 'Prompt', 'jetpack' ) }</dt>
				<dd>{ task.prompt }</dd>
				<dt>{ __( 'Latest result', 'jetpack' ) }</dt>
				<dd>
					<SafeSummary text={ task.latest_run?.summary || task.latest_run?.failure_reason } />
				</dd>
			</dl>
		</Modal>
	);
}

/**
 * Selectable task title used by the DataViews title field.
 *
 * @param {object}   props          - Component props.
 * @param {object}   props.item     - Task row.
 * @param {Function} props.onSelect - Selection callback.
 * @return {object} Task title button.
 */
function TaskLink( { item, onSelect } ) {
	const selectTask = useCallback( () => onSelect( item ), [ item, onSelect ] );
	return (
		<button className="jetpack-ai-scheduled-tasks__task-link" onClick={ selectTask }>
			{ item.title }
		</button>
	);
}

const getItemId = item => String( item.id );

/**
 * Scheduled tasks tab.
 *
 * @param {object}   props                     - Component props.
 * @param {number}   props.blogId              - WordPress.com site ID.
 * @param {string}   props.apiNonce            - Local REST nonce.
 * @param {Function} props.createSuccessNotice - Global success notice callback.
 * @param {Function} props.createErrorNotice   - Global error notice callback.
 * @return {object} Scheduled tasks UI.
 */
export default function ScheduledTasks( {
	blogId,
	apiNonce,
	createSuccessNotice,
	createErrorNotice,
} ) {
	const [ view, setView ] = useState( INITIAL_VIEW );
	const [ selectedTask, setSelectedTask ] = useState( null );
	const [ pendingDelete, setPendingDelete ] = useState( null );
	const { tasks, isLoading, error, inFlightIds, runNow, setStatus, deleteTask, refresh } =
		useScheduledTasks( { blogId, apiNonce } );

	const runMutation = useCallback(
		async ( operation, successMessage ) => {
			try {
				await operation();
				createSuccessNotice( successMessage, { id: 'jetpack-ai-scheduled-task-status' } );
			} catch ( mutationError ) {
				createErrorNotice( mutationError.message, {
					id: 'jetpack-ai-scheduled-task-status',
					explicitDismiss: true,
				} );
			}
		},
		[ createErrorNotice, createSuccessNotice ]
	);
	const closeDetail = useCallback( () => setSelectedTask( null ), [] );
	const closeDelete = useCallback( () => setPendingDelete( null ), [] );
	const retry = useCallback( () => refresh(), [ refresh ] );
	const confirmDelete = useCallback( () => {
		if ( ! pendingDelete ) {
			return;
		}
		const taskId = pendingDelete.id;
		setPendingDelete( null );
		runMutation( () => deleteTask( taskId ), __( 'The task was deleted.', 'jetpack' ) );
	}, [ deleteTask, pendingDelete, runMutation ] );

	const fields = useMemo(
		() => [
			{
				id: 'task',
				label: __( 'Task', 'jetpack' ),
				enableGlobalSearch: true,
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => <TaskLink item={ item } onSelect={ setSelectedTask } />,
			},
			{
				id: 'scheduled',
				label: __( 'Scheduled', 'jetpack' ),
				getValue: ( { item } ) => item.next_run_at || '',
				render: ( { item } ) => recurrenceLabel( item ),
			},
			{
				id: 'latest_run',
				label: __( 'Latest run', 'jetpack' ),
				getValue: ( { item } ) => item.latest_run?.completed_at || '',
				render: ( { item } ) =>
					item.latest_run?.completed_at
						? relativeDate( item.latest_run.completed_at )
						: item.latest_run?.status || '—',
			},
		],
		[]
	);

	const actions = useMemo(
		() => [
			{
				id: 'view',
				label: __( 'View', 'jetpack' ),
				callback: items => setSelectedTask( items[ 0 ] ),
				isEligible: item => ! inFlightIds.includes( item.id ),
			},
			{
				id: 'run-now',
				label: __( 'Run now', 'jetpack' ),
				callback: items =>
					runMutation( () => runNow( items[ 0 ].id ), __( 'The task is running now.', 'jetpack' ) ),
				isEligible: item => ! inFlightIds.includes( item.id ),
			},
			{
				id: 'toggle-status',
				label: __( 'Pause or resume', 'jetpack' ),
				callback: items => {
					const item = items[ 0 ];
					const nextStatus = item.status === 'active' ? 'paused' : 'active';
					return runMutation(
						() => setStatus( item.id, nextStatus ),
						STATUS_CHANGE_NOTICES[ nextStatus ]
					);
				},
				isEligible: item =>
					! inFlightIds.includes( item.id ) &&
					[ 'active', 'paused', 'failed' ].includes( item.status ),
			},
			{
				id: 'delete',
				label: __( 'Delete', 'jetpack' ),
				callback: items => setPendingDelete( items[ 0 ] ),
				isEligible: item => ! inFlightIds.includes( item.id ),
			},
		],
		[ inFlightIds, runMutation, runNow, setStatus ]
	);

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( tasks, view, fields ),
		[ fields, tasks, view ]
	);

	if ( isLoading ) {
		return (
			<div className="jetpack-ai-admin__loading">
				<Spinner />
			</div>
		);
	}
	if ( error ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ error }</Notice.Description>
				<Button variant="secondary" onClick={ retry }>
					{ __( 'Try again', 'jetpack' ) }
				</Button>
			</Notice.Root>
		);
	}

	const empty = (
		<div className="jetpack-ai-scheduled-tasks__empty">
			<h2>{ __( 'Schedule tasks for repeated work', 'jetpack' ) }</h2>
			<p>
				{ __(
					'Have your WordPress Agent run tasks on a regular basis. Draft content, get weekly reports, moderate comments, and more. Set one up right in the chat.',
					'jetpack'
				) }
			</p>
			<Button variant="primary" onClick={ openNewAgentChat }>
				{ __( 'Create a task', 'jetpack' ) }
			</Button>
		</div>
	);

	return (
		<section className="jetpack-ai-scheduled-tasks">
			{ tasks.length > 0 && (
				<div className="jetpack-ai-scheduled-tasks__header">
					<div>
						<h2>{ __( 'Scheduled tasks', 'jetpack' ) }</h2>
						<p>{ __( 'Automate repeated work with WordPress Agent.', 'jetpack' ) }</p>
					</div>
					<Button variant="primary" onClick={ openNewAgentChat }>
						{ __( 'Create a task', 'jetpack' ) }
					</Button>
				</div>
			) }
			<DataViews
				actions={ actions }
				data={ data }
				defaultLayouts={ { table: INITIAL_VIEW } }
				fields={ fields }
				getItemId={ getItemId }
				onChangeView={ setView }
				paginationInfo={ paginationInfo }
				view={ view }
				empty={ empty }
			/>
			{ selectedTask && <TaskDetail task={ selectedTask } onClose={ closeDetail } /> }
			{ pendingDelete && (
				<Modal title={ __( 'Delete task?', 'jetpack' ) } onRequestClose={ closeDelete }>
					<p>
						{ __( 'This permanently deletes the scheduled task:', 'jetpack' ) }{ ' ' }
						<strong>{ pendingDelete.title }</strong>
					</p>
					<div className="jetpack-ai-scheduled-tasks__confirm-actions">
						<Button variant="tertiary" onClick={ closeDelete }>
							{ __( 'Cancel', 'jetpack' ) }
						</Button>
						<Button variant="primary" isDestructive onClick={ confirmDelete }>
							{ __( 'Delete', 'jetpack' ) }
						</Button>
					</div>
				</Modal>
			) }
		</section>
	);
}
