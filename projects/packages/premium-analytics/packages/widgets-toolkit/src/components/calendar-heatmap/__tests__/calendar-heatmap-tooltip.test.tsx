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
	it( 'leads with the count and follows with the cell label', () => {
		const { container } = render(
			<CalendarHeatmapTooltip
				value={ 2033 }
				cellLabel="June 2, 2025"
				emptyLabel="No views"
				formatValue={ formatValue }
			/>
		);

		// The concatenation is what pins the order the component exists to hold:
		// count first, date second.
		expect( screen.getByText( '2033 views' ).tagName ).toBe( 'STRONG' );
		expect( container ).toHaveTextContent( '2033 viewsJune 2, 2025' );
	} );

	it.each( [
		[ 'null', null ],
		// The package builds without `strictNullChecks`, so `undefined` type-checks
		// here; outside the empty branch it would format as "NaN views".
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
