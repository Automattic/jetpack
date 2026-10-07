/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { MonthCalendarHeatmap } from '../month-calendar-heatmap';

const VALUE_BY_DAY = { '2025-10-03': 2 };
const RANGE = { start: '2025-10-01', end: '2026-09-14' };

const LABELS = {
	ariaLabel: 'Monthly posting activity',
	formatValue: ( value: number ) => `${ value } posts`,
	emptyLabel: 'No posts',
	lessLabel: 'Fewer posts',
	moreLabel: 'More posts',
};

describe( 'MonthCalendarHeatmap', () => {
	it( 'names the grid and labels both ends of the legend', () => {
		render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

		expect( screen.getByRole( 'grid', { name: 'Monthly posting activity' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Fewer posts' ) ).toBeInTheDocument();
		expect( screen.getByText( 'More posts' ) ).toBeInTheDocument();
	} );

	describe( 'on hover', () => {
		beforeEach( () => {
			jest.useFakeTimers();
		} );

		afterEach( () => {
			jest.useRealTimers();
		} );

		it( 'titles the tooltip with the date, then the count or the empty label', async () => {
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

			await user.hover( screen.getByRole( 'gridcell', { name: 'Fri, Oct 3, 2025: 2' } ) );
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Fri, Oct 3, 20252 posts' );

			await user.hover( screen.getByRole( 'gridcell', { name: 'Sat, Oct 4, 2025: No data' } ) );
			expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Sat, Oct 4, 2025No posts' );
		} );
	} );

	it( 'steps the arrow keys day by day across a month boundary', async () => {
		const user = userEvent.setup();
		render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );
		const grid = screen.getByRole( 'grid', { name: 'Monthly posting activity' } );
		const selectedName = () =>
			within( grid )
				.getAllByRole( 'gridcell' )
				.find( cell => cell.id === grid.getAttribute( 'aria-activedescendant' ) )
				?.getAttribute( 'aria-label' );

		grid.focus();
		await user.keyboard( '{ArrowRight}' );
		expect( selectedName() ).toBe( 'Wed, Oct 1, 2025: No data' );
		await user.keyboard( '{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}{ArrowRight}' );
		expect( selectedName() ).toBe( 'Fri, Oct 31, 2025: No data' );
		await user.keyboard( '{ArrowRight}' );
		expect( selectedName() ).toBe( 'Sat, Nov 1, 2025: No data' );
	} );

	describe( 'when the months overflow the tile', () => {
		beforeEach( () => {
			jest.spyOn( Element.prototype, 'scrollWidth', 'get' ).mockReturnValue( 900 );
		} );

		afterEach( () => {
			jest.restoreAllMocks();
			resetLocaleData();
		} );

		it( 'opens scrolled to the current month', () => {
			render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

			expect( screen.getByRole( 'grid' ).scrollLeft ).toBe( 900 );
		} );

		it( 'scrolls the other way in RTL', () => {
			setLocaleData( { 'text direction\u0004ltr': [ 'rtl' ] } );
			render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

			expect( screen.getByRole( 'grid' ).scrollLeft ).toBe( -900 );
		} );
	} );
} );
