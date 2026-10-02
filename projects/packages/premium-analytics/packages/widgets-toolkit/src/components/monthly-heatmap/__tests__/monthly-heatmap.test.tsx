/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { MonthlyHeatmap, type MonthlyHeatmapRow } from '../monthly-heatmap';

// The chart's responsive wrapper asks for a ResizeObserver jsdom does not have.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

const ROWS: MonthlyHeatmapRow[] = [
	{ year: 2026, months: [ 5, 0, 40, ...Array( 9 ).fill( null ) ], total: 45 },
	{ year: 2025, months: [ ...Array( 10 ).fill( null ), 10, 20 ], total: 30 },
];

const LABELS = {
	formatValue: ( value: number ) => `${ value } views`,
	emptyLabel: 'No views',
	lessLabel: 'Fewer',
	moreLabel: 'More',
};

describe( 'MonthlyHeatmap', () => {
	beforeAll( () => {
		( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = ResizeObserverStub;
	} );

	it( 'lays the years out newest first under the month names and a Totals column', () => {
		render( <MonthlyHeatmap rows={ ROWS } { ...LABELS } /> );

		const grid = screen.getByRole( 'grid' );
		expect( grid ).toHaveAttribute( 'aria-rowcount', '2' );
		expect( grid ).toHaveAttribute( 'aria-colcount', '13' );
		// The chart names a cell from its column, row and value.
		expect( screen.getByRole( 'gridcell', { name: 'Jan 2026: 5' } ) ).toBeInTheDocument();
		// A measured zero keeps its cell; filler months take no cell at all.
		expect( screen.getByRole( 'gridcell', { name: 'Feb 2026: 0' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'gridcell', { name: /Jan 2025/ } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'gridcell', { name: 'Totals 2025: 30' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fewer' ) ).toBeInTheDocument();
	} );

	it( 'draws the newest year first whatever order the rows arrive in', () => {
		render( <MonthlyHeatmap rows={ [ ...ROWS ].reverse() } { ...LABELS } /> );

		expect( screen.getByRole( 'gridcell', { name: 'Jan 2026: 5' } ) ).toHaveAttribute(
			'data-row',
			'0'
		);
		expect( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) ).toHaveAttribute(
			'data-row',
			'1'
		);
	} );

	it( 'draws a missing month as filler rather than a live cell', () => {
		render(
			<MonthlyHeatmap rows={ [ { year: 2026, months: [ 5, 0, 40 ], total: 45 } ] } { ...LABELS } />
		);

		expect( screen.getByRole( 'gridcell', { name: 'Mar 2026: 40' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'gridcell', { name: /Dec 2026/ } ) ).not.toBeInTheDocument();
	} );

	it( 'names a hovered month by month and year, and a hovered roll-up by the year alone', async () => {
		const user = userEvent.setup();
		render( <MonthlyHeatmap rows={ ROWS } { ...LABELS } /> );

		await user.hover( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( '10 views' );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Nov 2025' );

		await user.hover( screen.getByRole( 'gridcell', { name: 'Totals 2025: 30' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( '30 views' );
		expect( screen.getByRole( 'tooltip' ) ).not.toHaveTextContent( 'Totals' );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( '2025' );
	} );

	it( 'reports a clicked month and a clicked roll-up', async () => {
		const onSelect = jest.fn();
		const user = userEvent.setup();
		render( <MonthlyHeatmap rows={ ROWS } { ...LABELS } onSelect={ onSelect } /> );

		await user.click( screen.getByRole( 'gridcell', { name: 'Nov 2025: 10' } ) );
		expect( onSelect ).toHaveBeenLastCalledWith( { year: 2025, month: 10 } );

		await user.click( screen.getByRole( 'gridcell', { name: 'Totals 2026: 45' } ) );
		expect( onSelect ).toHaveBeenLastCalledWith( { year: 2026 } );
	} );

	it( 'reports the keyboard-selected cell on Enter and Space, and only those', async () => {
		const onSelect = jest.fn();
		const user = userEvent.setup();
		render( <MonthlyHeatmap rows={ ROWS } { ...LABELS } onSelect={ onSelect } /> );

		const grid = screen.getByRole( 'grid' );
		grid.focus();
		// Nothing is selected until an arrow key moves the selection.
		await user.keyboard( '{Enter}' );
		await user.keyboard( '{ArrowRight}' );
		expect( onSelect ).not.toHaveBeenCalled();

		await user.keyboard( '{Enter}' );
		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		await user.keyboard( ' ' );
		expect( onSelect ).toHaveBeenCalledTimes( 2 );
		expect( onSelect.mock.calls[ 0 ][ 0 ] ).toEqual( onSelect.mock.calls[ 1 ][ 0 ] );
	} );

	it( 'reads the keyboard selection when a click left the focus on a cell', async () => {
		const onSelect = jest.fn();
		const user = userEvent.setup();
		render( <MonthlyHeatmap rows={ ROWS } { ...LABELS } onSelect={ onSelect } /> );

		// The click focuses the cell, not the grid; the arrow key still moves the
		// grid's selection, and Enter must find it from the cell.
		await user.click( screen.getByRole( 'gridcell', { name: 'Dec 2025: 20' } ) );
		await user.keyboard( '{ArrowRight}{Enter}' );

		expect( onSelect ).toHaveBeenCalledTimes( 2 );
		expect( onSelect ).toHaveBeenLastCalledWith( { year: 2026, month: 0 } );
	} );
} );
