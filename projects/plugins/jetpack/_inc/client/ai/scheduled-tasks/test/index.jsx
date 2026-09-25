import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScheduledTasks from '../index';
import { useScheduledTasks } from '../use-scheduled-tasks';

jest.mock( '../use-scheduled-tasks', () => ( { useScheduledTasks: jest.fn() } ) );
jest.mock( '@wordpress/dataviews', () => {
	const { createElement } = require( 'react' );
	return {
		filterSortAndPaginate: data => ( { data, paginationInfo: { totalItems: data.length } } ),
		DataViews: ( { actions, data, fields, empty } ) => {
			if ( data.length === 0 ) {
				return empty;
			}
			const item = data[ 0 ];
			return createElement(
				'div',
				null,
				...fields.map( field =>
					createElement( 'div', { key: field.id }, field.render( { item } ) )
				),
				...actions.map( action =>
					createElement(
						'button',
						{
							key: action.id,
							'data-primary': action.isPrimary || undefined,
							onClick: () => action.callback( [ item ] ),
						},
						action.label
					)
				)
			);
		},
	};
} );

const task = {
	id: 7,
	title: 'Weekly report',
	prompt: 'Summarize this week.',
	status: 'active',
	next_run_at: '2026-08-24T09:00:00Z',
	recurrence: { type: 'weekly', timezone: 'Europe/Warsaw' },
	latest_run: { status: 'completed', completed_at: '2026-08-17T09:00:00Z', summary: 'Done.' },
};

let hookResult;

beforeEach( () => {
	window.__agentsManagerActions = {
		isReady: true,
		chatNavigate: jest.fn(),
		setChatDocked: jest.fn(),
		setChatOpen: jest.fn(),
		setContextEntry: jest.fn(),
		setContextCard: jest.fn(),
		removeContextEntry: jest.fn(),
		removeContextCard: jest.fn(),
	};
	hookResult = {
		tasks: [ task ],
		isLoading: false,
		error: null,
		inFlightIds: [],
		runNow: jest.fn( () => Promise.resolve() ),
		setStatus: jest.fn( () => Promise.resolve() ),
		deleteTask: jest.fn( () => Promise.resolve() ),
		refresh: jest.fn(),
	};
	useScheduledTasks.mockImplementation( () => hookResult );
} );

afterEach( () => {
	delete window.__agentsManagerActions;
} );

test( 'renders the table, opens task context in chat, and runs a task now', async () => {
	const createSuccessNotice = jest.fn();
	render(
		<ScheduledTasks
			blogId={ 123 }
			apiNonce="nonce"
			createSuccessNotice={ createSuccessNotice }
			createErrorNotice={ jest.fn() }
		/>
	);

	await userEvent.click( screen.getByRole( 'button', { name: 'Weekly report' } ) );
	expect( screen.getByRole( 'button', { name: 'View' } ) ).toHaveAttribute(
		'data-primary',
		'true'
	);
	expect( window.__agentsManagerActions.setContextEntry ).toHaveBeenCalledWith(
		expect.objectContaining( {
			id: 'jetpack-ai/selected-scheduled-task',
			delivery: 'conversation',
			data: expect.objectContaining( { taskId: 7, prompt: 'Summarize this week.' } ),
		} )
	);
	expect( window.__agentsManagerActions.setContextCard ).toHaveBeenCalledWith(
		expect.objectContaining( {
			id: 'jetpack-ai/selected-scheduled-task-card',
			contextEntryIds: [ 'jetpack-ai/selected-scheduled-task' ],
		} )
	);
	expect( window.__agentsManagerActions.chatNavigate ).toHaveBeenCalledWith( '/chat' );
	expect( window.__agentsManagerActions.setChatOpen ).toHaveBeenCalledWith( true );
	expect( window.__agentsManagerActions.setChatDocked ).not.toHaveBeenCalled();

	await userEvent.click( screen.getByRole( 'button', { name: 'Run now' } ) );
	await waitFor( () => expect( hookResult.runNow ).toHaveBeenCalledWith( 7 ) );
	expect( createSuccessNotice ).toHaveBeenCalledWith(
		'The task is running now.',
		expect.any( Object )
	);
} );

test( 'renders the latest result as safe Markdown', async () => {
	hookResult.tasks = [
		{
			...task,
			latest_run: {
				...task.latest_run,
				summary:
					'**Views:** 4\n\n- Two visitors\n- [View report](https://example.com)\n\n<script>alert("nope")</script>',
			},
		},
	];

	render(
		<ScheduledTasks
			blogId={ 123 }
			apiNonce="nonce"
			createSuccessNotice={ jest.fn() }
			createErrorNotice={ jest.fn() }
		/>
	);

	await userEvent.click( screen.getByRole( 'button', { name: 'Weekly report' } ) );
	const card = window.__agentsManagerActions.setContextCard.mock.calls.at( -1 )[ 0 ];
	render( card.body );
	expect( screen.getByText( 'Views:' ).tagName ).toBe( 'STRONG' );
	expect( screen.getByText( 'Two visitors' ).tagName ).toBe( 'LI' );
	expect( screen.getByRole( 'link', { name: 'View report' } ) ).toHaveAttribute(
		'target',
		'_blank'
	);
	expect( screen.getByText( /<script>alert\("nope"\)<\/script>/ ) ).toBeInTheDocument();
} );

test( 'starts a new chat without changing the persisted docking preference', async () => {
	hookResult.tasks = [];

	render(
		<ScheduledTasks
			blogId={ 123 }
			apiNonce="nonce"
			createSuccessNotice={ jest.fn() }
			createErrorNotice={ jest.fn() }
		/>
	);

	await userEvent.click( screen.getByRole( 'button', { name: 'Create a task' } ) );
	expect( window.__agentsManagerActions.removeContextCard ).toHaveBeenCalledWith(
		'jetpack-ai/selected-scheduled-task-card'
	);
	expect( window.__agentsManagerActions.removeContextEntry ).toHaveBeenCalledWith(
		'jetpack-ai/selected-scheduled-task'
	);
	expect( window.__agentsManagerActions.chatNavigate ).toHaveBeenCalledWith( '/' );
	expect( window.__agentsManagerActions.setChatOpen ).toHaveBeenCalledWith( true );
	expect( window.__agentsManagerActions.setChatDocked ).not.toHaveBeenCalled();
} );

test( 'requires confirmation before deleting', async () => {
	render(
		<ScheduledTasks
			blogId={ 123 }
			apiNonce="nonce"
			createSuccessNotice={ jest.fn() }
			createErrorNotice={ jest.fn() }
		/>
	);

	await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );
	expect( screen.getByText( 'Delete task?' ) ).toBeInTheDocument();
	expect( hookResult.deleteTask ).not.toHaveBeenCalled();

	await userEvent.click( screen.getAllByRole( 'button', { name: 'Delete' } ).at( -1 ) );
	await waitFor( () => expect( hookResult.deleteTask ).toHaveBeenCalledWith( 7 ) );
} );
