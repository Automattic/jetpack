import { render, screen } from '@testing-library/react';
import { LeaderboardChartUnresponsive as LeaderboardChart } from '../leaderboard-chart';
import type { LeaderboardEntry } from '../../../types';

const ROW_HEIGHT = 40;

const makeData = ( count: number ): LeaderboardEntry[] =>
	Array.from( { length: count }, ( _, index ) => ( {
		id: `row-${ index }`,
		label: `Row ${ index }`,
		currentValue: 100 - index,
		currentShare: 100 - index * 10,
	} ) );

/**
 * Give the content container a fixed height and lay every marked row out in a
 * uniform stack beneath it. JSDOM performs no layout, so the geometry the
 * component measures has to be supplied here.
 *
 * @param contentHeight - Visible height of the chart's content container.
 * @return Cleanup function restoring the original getBoundingClientRect.
 */
const mockLayout = ( contentHeight: number ) => {
	const original = Element.prototype.getBoundingClientRect;

	Element.prototype.getBoundingClientRect = function () {
		if ( this.classList.contains( 'leaderboardChart__content' ) ) {
			return { top: 0, bottom: contentHeight, height: contentHeight } as DOMRect;
		}

		const rowIndex = this.getAttribute?.( 'data-row-index' );
		if ( rowIndex !== null && rowIndex !== undefined ) {
			const top = Number( rowIndex ) * ROW_HEIGHT;
			return { top, bottom: top + ROW_HEIGHT, height: ROW_HEIGHT } as DOMRect;
		}

		return original.call( this );
	};

	return () => {
		Element.prototype.getBoundingClientRect = original;
	};
};

describe( 'LeaderboardChart fitRows', () => {
	let restoreLayout: () => void;

	afterEach( () => {
		restoreLayout?.();
	} );

	it( 'hides rows that do not fit the content height', () => {
		// 100px of content fits two whole 40px rows; the third would be clipped.
		restoreLayout = mockLayout( 100 );

		render( <LeaderboardChart data={ makeData( 5 ) } fitRows /> );

		expect( screen.getByText( 'Row 0' ) ).toBeVisible();
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();
		expect( screen.getByText( 'Row 3' ) ).not.toBeVisible();
		expect( screen.getByText( 'Row 4' ) ).not.toBeVisible();
	} );

	it( 'explains itself when not even one row fits', () => {
		// 20px of content cannot fit a 40px row. Hiding every row would leave a
		// blank panel, which reads as a broken tile rather than an empty one.
		restoreLayout = mockLayout( 20 );

		render( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Not enough space to display data' ) ).toBeVisible();
		expect( screen.getByText( 'Row 0' ) ).not.toBeVisible();
	} );

	it( 'leaves every row visible when fitRows is off', () => {
		// Default behaviour: a standalone chart scrolls rather than dropping rows.
		restoreLayout = mockLayout( 100 );

		render( <LeaderboardChart data={ makeData( 5 ) } /> );

		expect( screen.getByText( 'Row 4' ) ).toBeVisible();
	} );

	it( 'counts rows the same way whether or not they are interactive', () => {
		// An interactive row is one button in the grid; a non-interactive row is
		// two bare grid cells. Both shapes must resolve to a single row each.
		restoreLayout = mockLayout( 100 );

		const data = makeData( 5 ).map( ( entry, index ) =>
			index % 2 === 0 ? { ...entry, onClick: () => {} } : entry
		);

		render( <LeaderboardChart data={ data } fitRows /> );

		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();
	} );

	it( 'hides interactive rows that do not fit, not just their labels', () => {
		restoreLayout = mockLayout( 100 );

		const data = makeData( 5 ).map( entry => ( { ...entry, onClick: () => {} } ) );

		render( <LeaderboardChart data={ data } fitRows /> );

		const rows = screen.getAllByRole( 'button', { hidden: true } );
		expect( rows[ 1 ] ).toBeVisible();
		expect( rows[ 2 ] ).not.toBeVisible();
	} );

	it( 'keeps hidden rows measurable so a taller container can reveal them', () => {
		// The rows must stay in the layout even when none of them fit. Dropping
		// them would leave nothing to measure, so the row count could never
		// recover when the container grows.
		restoreLayout = mockLayout( 20 );

		render( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Row 0' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row 2' ) ).toBeInTheDocument();
	} );
} );
