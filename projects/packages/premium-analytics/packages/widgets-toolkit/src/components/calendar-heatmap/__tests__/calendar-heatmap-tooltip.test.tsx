/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { CalendarHeatmapTooltip } from '../calendar-heatmap-tooltip';

const formatValue = ( value: number ) => `${ value } views`;

describe( 'CalendarHeatmapTooltip', () => {
	it( 'leads with the cell label as the title and follows with the count', () => {
		const { container } = render(
			<CalendarHeatmapTooltip
				value={ 2033 }
				cellLabel="June 2, 2025"
				emptyLabel="No views"
				formatValue={ formatValue }
			/>
		);

		// The concatenation is what pins the order the component exists to hold:
		// date first, count second.
		expect( screen.getByText( 'June 2, 2025' ).tagName ).toBe( 'STRONG' );
		expect( container ).toHaveTextContent( 'June 2, 20252033 views' );
	} );

	it( 'draws the icon beside the count when given one', () => {
		render(
			<CalendarHeatmapTooltip
				value={ 3 }
				cellLabel="June 2, 2025"
				emptyLabel="No posts"
				formatValue={ value => `${ value } posts` }
				icon={ <svg data-testid="count-icon" /> }
			/>
		);

		expect( screen.getByText( '3 posts' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'count-icon' ) ).toBeInTheDocument();
	} );

	it( 'joins the label and the count on one line when inline', () => {
		render(
			<CalendarHeatmapTooltip
				value={ 15532 }
				cellLabel="Jun 2023"
				emptyLabel="No views"
				formatValue={ formatValue }
				inline
			/>
		);

		expect( screen.getByText( 'Jun 2023 · 15532 views' ).tagName ).toBe( 'STRONG' );
	} );

	it.each( [
		[ 'null', null ],
		// The package builds without `strictNullChecks`, so `undefined` type-checks
		// here; without the `== null` check it would render "undefined views".
		[ 'undefined', undefined ],
	] )( 'shows the empty label instead of a count for a %s cell', ( _label, value ) => {
		render(
			<CalendarHeatmapTooltip
				value={ value }
				cellLabel="June 3, 2025"
				emptyLabel="No views"
				formatValue={ formatValue }
			/>
		);

		expect( screen.getByText( 'No views' ) ).toBeInTheDocument();
	} );

	it( 'renders a counted zero rather than treating it as empty', () => {
		// Only `null` is empty; a real zero was measured and must not borrow the
		// empty label.
		render(
			<CalendarHeatmapTooltip
				value={ 0 }
				cellLabel="June 4, 2025"
				emptyLabel="No views"
				formatValue={ formatValue }
			/>
		);

		expect( screen.getByText( '0 views' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'No views' ) ).not.toBeInTheDocument();
	} );
} );
