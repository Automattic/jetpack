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
		render(
			<CalendarHeatmapTooltip
				value={ 2033 }
				cellLabel="June 2, 2025"
				emptyLabel="No views"
				formatValue={ formatValue }
			/>
		);

		expect( screen.getByText( '2033 views' ).tagName ).toBe( 'STRONG' );
		expect( screen.getByText( 'June 2, 2025' ) ).toBeInTheDocument();
	} );

	it( 'shows the empty label instead of a count for a blank cell', () => {
		render(
			<CalendarHeatmapTooltip
				value={ null }
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
