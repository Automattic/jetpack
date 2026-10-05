/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { MonthCalendarHeatmap } from '../month-calendar-heatmap';

const VALUE_BY_DAY = { '2025-10-03': 2, '2026-09-14': 1 };
const RANGE = { start: '2025-10-01', end: '2026-09-14' };

const LABELS = {
	ariaLabel: 'Monthly posting activity',
	formatValue: ( value: number ) => `${ value } posts`,
	emptyLabel: 'No posts',
	lessLabel: 'Fewer posts',
	moreLabel: 'More posts',
};

describe( 'MonthCalendarHeatmap', () => {
	it( 'draws one grid of twelve named months on a shared scale, weeks from Monday', () => {
		render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

		const grid = screen.getByRole( 'grid', { name: 'Monthly posting activity' } );
		expect( screen.getAllByRole( 'grid' ) ).toHaveLength( 1 );
		expect( grid ).toHaveAttribute( 'aria-colcount', '84' );
		expect( screen.getAllByTestId( 'heatmap-group-label' ).map( el => el.textContent ) ).toEqual( [
			'Oct',
			'Nov',
			'Dec',
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
		] );
		expect( screen.getByText( 'Fewer posts' ) ).toBeInTheDocument();
		expect( screen.getByText( 'More posts' ) ).toBeInTheDocument();
		// October 2025 opens on a Wednesday: the third weekday column from Monday.
		expect( screen.getByRole( 'gridcell', { name: 'Wed, Oct 1, 2025: No data' } ) ).toHaveAttribute(
			'data-column',
			'2'
		);
	} );

	it( 'fades the days after the range end instead of reporting them', () => {
		render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

		expect( screen.getByRole( 'gridcell', { name: 'Mon, Sep 14, 2026: 1' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'gridcell', { name: /Sep 15, 2026/ } ) ).not.toBeInTheDocument();
		// The rest of September: 16 filler days.
		expect( screen.getAllByTestId( 'heatmap-cell-placeholder' ) ).toHaveLength( 16 );
	} );

	it( 'titles the tooltip with the date, then the count or the empty label', async () => {
		const user = userEvent.setup();
		render( <MonthCalendarHeatmap valueByDay={ VALUE_BY_DAY } range={ RANGE } { ...LABELS } /> );

		await user.hover( screen.getByRole( 'gridcell', { name: 'Fri, Oct 3, 2025: 2' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Fri, Oct 3, 20252 posts' );

		await user.hover( screen.getByRole( 'gridcell', { name: 'Sat, Oct 4, 2025: No data' } ) );
		expect( screen.getByRole( 'tooltip' ) ).toHaveTextContent( 'Sat, Oct 4, 2025No posts' );
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
