/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { MetricNoteTooltip } from '../metric-note-tooltip';

const NOTE = 'Sum of daily visitors.';

type User = ReturnType< typeof userEvent.setup >;

function setup( note?: string ) {
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	render( <MetricNoteTooltip note={ note }>Visitors</MetricNoteTooltip> );
	return user;
}

async function settle() {
	await act( () => jest.runAllTimersAsync() );
}

describe( 'MetricNoteTooltip', () => {
	beforeEach( () => jest.useFakeTimers() );
	afterEach( () => jest.useRealTimers() );

	it.each( [
		[ 'hover', ( user: User ) => user.hover( screen.getByText( 'Visitors' ) ) ],
		[ 'keyboard focus', ( user: User ) => user.tab() ],
	] )( 'shows the note in a tooltip on %s', async ( _, open ) => {
		const user = setup( NOTE );

		await open( user );
		await settle();

		expect( screen.getByTestId( 'metric-note-tooltip' ) ).toHaveTextContent( NOTE );
	} );

	it( 'gives assistive tech the note once, while the tooltip is open', async () => {
		const user = setup( NOTE );

		await user.tab();
		await settle();

		expect( screen.getAllByText( NOTE ) ).toHaveLength( 2 );
		expect( screen.getByTestId( 'metric-note-tooltip' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByTestId( 'metric-note-tooltip' ) ).not.toHaveAttribute( 'tabindex' );
	} );

	it( 'leaves a metric with no note out of the tab order', async () => {
		const user = setup();

		await user.tab();

		expect( document.body ).toHaveFocus();
	} );
} );
