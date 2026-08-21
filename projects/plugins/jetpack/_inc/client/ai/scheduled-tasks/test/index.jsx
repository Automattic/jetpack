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
						{ key: action.id, onClick: () => action.callback( [ item ] ) },
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

test( 'renders the table, opens details, and runs a task now', async () => {
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
	expect( screen.getByText( 'Summarize this week.' ) ).toBeInTheDocument();
	expect( screen.getByText( 'Done.' ) ).toBeInTheDocument();
	await userEvent.click( screen.getByRole( 'button', { name: 'Close' } ) );
	await waitFor( () => expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument() );

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
	expect( screen.getByText( 'Views:' ).tagName ).toBe( 'STRONG' );
	expect( screen.getByText( 'Two visitors' ).tagName ).toBe( 'LI' );
	expect( screen.getByRole( 'link', { name: 'View report' } ) ).toHaveAttribute(
		'target',
		'_blank'
	);
	expect( screen.getByText( /<script>alert\("nope"\)<\/script>/ ) ).toBeInTheDocument();
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
