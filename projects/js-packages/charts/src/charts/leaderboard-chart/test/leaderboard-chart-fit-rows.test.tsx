import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SUBPIXEL_TOLERANCE } from '../hooks';
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
 * Give the content container a height and lay every marked row out in a uniform
 * stack beneath it. JSDOM performs no layout, so the geometry the component
 * measures has to be supplied here.
 *
 * The height is mutable and `resizeTo` re-fires the observed callbacks, because
 * a fixed height would let the whole ResizeObserver path be deleted with the
 * suite still green.
 *
 * @param contentHeight - Starting height of the chart's content container.
 * @param getRowBottom  - Returns the bottom edge for a row index.
 * @return Handle for resizing the container and restoring the globals.
 */
const mockLayout = (
	contentHeight: number,
	getRowBottom: ( rowIndex: number ) => number = rowIndex => ( rowIndex + 1 ) * ROW_HEIGHT
) => {
	const originalGetRect = Element.prototype.getBoundingClientRect;
	const originalResizeObserver = globalThis.ResizeObserver;
	const box = { height: contentHeight };
	const callbacks = new Set< ResizeObserverCallback >();

	Element.prototype.getBoundingClientRect = function () {
		if ( this.classList.contains( 'leaderboardChart__content' ) ) {
			return { top: 0, bottom: box.height, height: box.height } as DOMRect;
		}

		const rowIndex = this.getAttribute?.( 'data-row-index' );
		if ( rowIndex !== null && rowIndex !== undefined ) {
			const bottom = getRowBottom( Number( rowIndex ) );
			return { top: bottom - ROW_HEIGHT, bottom, height: ROW_HEIGHT } as DOMRect;
		}

		return originalGetRect.call( this );
	};

	globalThis.ResizeObserver = class {
		#callback: ResizeObserverCallback;

		constructor( callback: ResizeObserverCallback ) {
			this.#callback = callback;
		}

		observe() {
			callbacks.add( this.#callback );
		}

		unobserve() {}

		disconnect() {
			callbacks.delete( this.#callback );
		}
	} as unknown as typeof globalThis.ResizeObserver;

	return {
		observerCount: () => callbacks.size,
		resizeTo: ( height: number ) =>
			act( () => {
				box.height = height;
				callbacks.forEach( callback => callback( [], {} as ResizeObserver ) );
			} ),
		restore: () => {
			Element.prototype.getBoundingClientRect = originalGetRect;
			globalThis.ResizeObserver = originalResizeObserver;
		},
	};
};

describe( 'LeaderboardChart fitRows', () => {
	let layout: ReturnType< typeof mockLayout >;

	afterEach( () => {
		layout?.restore();
	} );

	it( 'hides rows that do not fit the content height', () => {
		// 100px of content fits two whole 40px rows; the third would be clipped.
		layout = mockLayout( 100 );

		render( <LeaderboardChart data={ makeData( 5 ) } fitRows /> );

		expect( screen.getByText( 'Row 0' ) ).toBeVisible();
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();
		expect( screen.getByText( 'Row 3' ) ).not.toBeVisible();
		expect( screen.getByText( 'Row 4' ) ).not.toBeVisible();
	} );

	it( 'shows every row when they fit exactly', () => {
		// Boundary case for the `<=` in the fit scan: the last row's bottom edge
		// lands exactly on the container's.
		layout = mockLayout( 5 * ROW_HEIGHT );

		render( <LeaderboardChart data={ makeData( 5 ) } fitRows /> );

		expect( screen.getByText( 'Row 4' ) ).toBeVisible();
	} );

	it( 'treats a row ending within the subpixel tolerance as fitting', () => {
		// Row 1's bottom is 80. Heights are derived from the real tolerance so
		// retuning it does not fail this test for the wrong reason.
		const rowBottom = 2 * ROW_HEIGHT;
		layout = mockLayout( rowBottom - SUBPIXEL_TOLERANCE + 0.1 );

		render( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Row 1' ) ).toBeVisible();

		// A hair past the tolerance, so the row is genuinely clipped.
		layout.resizeTo( rowBottom - SUBPIXEL_TOLERANCE - 0.1 );

		expect( screen.getByText( 'Row 1' ) ).not.toBeVisible();
	} );

	it( 'reveals rows when the container grows and hides them when it shrinks', () => {
		// Hiding rows is only acceptable because a taller container brings them
		// back, so the round trip is the property worth pinning — not the first
		// render, which a one-shot measurement would also satisfy.
		layout = mockLayout( 100 );

		render( <LeaderboardChart data={ makeData( 5 ) } fitRows /> );
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();

		layout.resizeTo( 5 * ROW_HEIGHT );
		expect( screen.getByText( 'Row 4' ) ).toBeVisible();

		layout.resizeTo( 60 );
		expect( screen.getByText( 'Row 1' ) ).not.toBeVisible();

		// Out through "nothing fits" and back again.
		layout.resizeTo( 20 );
		expect( screen.getByText( 'Not enough space to display data' ) ).toBeVisible();

		layout.resizeTo( 5 * ROW_HEIGHT );
		expect( screen.getByText( 'Row 4' ) ).toBeVisible();
		expect( screen.queryByText( 'Not enough space to display data' ) ).not.toBeInTheDocument();
	} );

	it( 'explains itself when not even one row fits', () => {
		// 20px of content cannot fit a 40px row. Hiding every row would leave a
		// blank panel, which reads as a broken tile rather than an empty one.
		layout = mockLayout( 20 );

		render( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Not enough space to display data' ) ).toBeVisible();
		expect( screen.getByText( 'Row 0' ) ).not.toBeVisible();
	} );

	it( 'leaves every row visible when fitRows is off', () => {
		// Default behaviour: a standalone chart scrolls rather than dropping rows.
		layout = mockLayout( 100 );

		render( <LeaderboardChart data={ makeData( 5 ) } /> );

		expect( screen.getByText( 'Row 4' ) ).toBeVisible();
	} );

	it( 'restores every row when fitRows is turned off, and refits when it returns', () => {
		layout = mockLayout( 100 );

		const data = makeData( 5 );
		const { rerender } = render( <LeaderboardChart data={ data } fitRows /> );
		expect( screen.getByText( 'Row 4' ) ).not.toBeVisible();

		rerender( <LeaderboardChart data={ data } fitRows={ false } /> );
		expect( screen.getByText( 'Row 4' ) ).toBeVisible();

		rerender( <LeaderboardChart data={ data } fitRows /> );
		expect( screen.getByText( 'Row 4' ) ).not.toBeVisible();
	} );

	it( 'stops observing once fitting is disabled', () => {
		layout = mockLayout( 100 );

		const data = makeData( 5 );
		const { rerender } = render( <LeaderboardChart data={ data } fitRows /> );
		expect( layout.observerCount() ).toBeGreaterThan( 0 );

		rerender( <LeaderboardChart data={ data } fitRows={ false } /> );
		expect( layout.observerCount() ).toBe( 0 );
	} );

	it( 'counts rows the same way whether or not they are interactive', () => {
		// An interactive row is one button in the grid; a non-interactive row is
		// two bare grid cells. Both shapes must resolve to a single row each.
		layout = mockLayout( 100 );

		const data = makeData( 5 ).map( ( entry, index ) =>
			index % 2 === 0 ? { ...entry, onClick: () => {} } : entry
		);

		render( <LeaderboardChart data={ data } fitRows /> );

		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();
	} );

	it( 'hides interactive rows that do not fit, not just their labels', () => {
		layout = mockLayout( 100 );

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
		layout = mockLayout( 20 );

		render( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Row 0' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row 2' ) ).toBeInTheDocument();
	} );

	it( 'refits when the data prop grows and shrinks', () => {
		layout = mockLayout( 100 );

		const { rerender } = render( <LeaderboardChart data={ makeData( 2 ) } fitRows /> );
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();

		rerender( <LeaderboardChart data={ makeData( 5 ) } fitRows /> );
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();

		rerender( <LeaderboardChart data={ makeData( 2 ) } fitRows /> );
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
	} );

	it( 'remeasures when row geometry changes without changing the row count or grid size', () => {
		let rowBottoms = [ 40, 80, 120 ];
		layout = mockLayout( 100, rowIndex => rowBottoms[ rowIndex ] );

		const { rerender } = render( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Row 1' ) ).toBeVisible();

		// Simulate a same-length data update where the second row grows while a
		// later row shrinks, leaving the grid's overall height unchanged.
		rowBottoms = [ 40, 110, 120 ];
		rerender( <LeaderboardChart data={ makeData( 3 ) } fitRows /> );

		expect( screen.getByText( 'Row 0' ) ).toBeVisible();
		expect( screen.getByText( 'Row 1' ) ).not.toBeVisible();
	} );

	it( 'resets an existing scroll offset when fitting is enabled', () => {
		layout = mockLayout( 100, rowIndex => {
			const content = screen.getByTestId( 'leaderboard-chart-content' );
			return ( rowIndex + 1 ) * ROW_HEIGHT - content.scrollTop;
		} );

		const data = makeData( 5 );
		const { rerender } = render( <LeaderboardChart data={ data } /> );
		const content = screen.getByTestId( 'leaderboard-chart-content' );
		content.scrollTop = 80;

		rerender( <LeaderboardChart data={ data } fitRows /> );

		expect( content.scrollTop ).toBe( 0 );
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();
	} );

	it( 'falls back to showing every row when no rows can be measured', () => {
		// A changed DOM shape must degrade to the scrollable default rather than
		// to an empty tile claiming there is no space.
		layout = mockLayout( 100 );

		render( <LeaderboardChart data={ makeData( 5 ) } fitRows /> );

		const content = screen.getByTestId( 'leaderboard-chart-content' );
		// Simulating the failure means reaching for the markers themselves — there
		// is no user-facing handle for "the row markers went away".
		// eslint-disable-next-line testing-library/no-node-access
		const cells = content.querySelectorAll( '[data-row-index]' );
		cells.forEach( cell => cell.removeAttribute( 'data-row-index' ) );

		// resizeTo re-fires the observed callbacks inside act.
		layout.resizeTo( 100 );

		expect( screen.getByText( 'Row 4' ) ).toBeVisible();
		expect( screen.queryByText( 'Not enough space to display data' ) ).not.toBeInTheDocument();
	} );

	it( 'remeasures rows when an interactive legend restores a hidden series', async () => {
		layout = mockLayout( 100 );
		const user = userEvent.setup();

		const data = makeData( 3 ).map( entry => ( {
			...entry,
			previousValue: entry.currentValue - 10,
			previousShare: entry.currentShare - 10,
			delta: 10,
		} ) );

		render(
			<LeaderboardChart
				data={ data }
				fitRows
				withComparison
				showLegend
				legend={ { interactive: true } }
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Current period: visible. Toggle visibility.',
			} )
		);
		await user.click(
			screen.getByRole( 'button', {
				name: 'Previous period: visible. Toggle visibility.',
			} )
		);

		expect(
			screen.getByText( 'All series are hidden. Click legend items to show data.' )
		).toBeVisible();

		// Nothing is observed while no rows are mounted, so a late notification
		// cannot record zero rows against the grid that replaces them.
		expect( layout.observerCount() ).toBe( 0 );

		await user.click(
			screen.getByRole( 'button', {
				name: 'Current period: hidden. Toggle visibility.',
			} )
		);

		expect( screen.getByText( 'Row 0' ) ).toBeVisible();
		expect( screen.getByText( 'Row 1' ) ).toBeVisible();
		expect( screen.getByText( 'Row 2' ) ).not.toBeVisible();
		expect( screen.queryByText( 'Not enough space to display data' ) ).not.toBeInTheDocument();
	} );
} );
