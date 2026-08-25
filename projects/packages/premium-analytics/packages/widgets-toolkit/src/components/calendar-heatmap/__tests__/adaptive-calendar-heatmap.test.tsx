/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { AdaptiveCalendarHeatmap } from '../adaptive-calendar-heatmap';
import { CalendarHeatmapPagerOverlay } from '../calendar-heatmap-pager-overlay';
import type { AdaptiveCalendarHeatmapChartProps } from '../adaptive-calendar-heatmap';
import type { CalendarHeatmapPager } from '../calendar-heatmap-pager-overlay';

const PERIOD = { startDate: '2025-01-01', endDate: '2025-12-31' };
const ONE_MONTH = { startDate: '2025-06-01', endDate: '2025-06-30' };

// The body height of a one-row dashboard tile, measured in the widget dashboard:
// a 200px grid row less the widget's own chrome. The shipped size for both
// calendar heatmaps, and the tightest one they have to fit.
const ONE_ROW_TILE_HEIGHT = 86;

// A single populated day is enough: these tests are about geometry, and it also
// shows whether the day survived the window the tile settled on.
const VALUE_BY_DAY = { '2025-06-02': 120 };

// jsdom reports every element as 0x0, so the tile has to be faked. Returns a
// restore callback.
function stubTileSize( width: number, height: number ) {
	const original = Element.prototype.getBoundingClientRect;

	Element.prototype.getBoundingClientRect = () => ( { width, height } ) as DOMRect;

	return () => {
		Element.prototype.getBoundingClientRect = original;
	};
}

// Renders into a tile of the given size and returns the resolved chart props as
// plain values. Snapshotting them here (rather than handing back a DOM node)
// keeps each call independent, so a test can measure two tile sizes in a row.
function chartFor( {
	width,
	height,
	period = PERIOD,
	valueByDay = VALUE_BY_DAY,
}: {
	width: number;
	height: number;
	period?: { startDate: string; endDate: string };
	valueByDay?: Record< string, number | null >;
} ) {
	const restoreTileSize = stubTileSize( width, height );
	let view;

	try {
		view = render(
			<AdaptiveCalendarHeatmap valueByDay={ valueByDay } period={ period }>
				{ ( chartProps: AdaptiveCalendarHeatmapChartProps ) => (
					<div
						data-testid="chart"
						data-columns={ chartProps.data.length }
						data-show-values={ String( Boolean( chartProps.showValues ) ) }
						data-width={ String( chartProps.width ) }
						data-height={ String( chartProps.height ) }
						data-last-visible-label={
							chartProps.data
								.flatMap( column => column.data )
								.filter( cell => ! cell.hidden && ! cell.placeholder )
								.map( cell => cell.label )
								.slice( -1 )[ 0 ]
						}
						data-values={ chartProps.data
							.flatMap( column => column.data )
							.filter( cell => cell.value !== null )
							.map( cell => `${ cell.label }:${ cell.value }` )
							.join( '|' ) }
						data-placeholders={ String(
							chartProps.data.flatMap( column => column.data ).filter( cell => cell.placeholder )
								.length
						) }
						data-first-real-label={
							chartProps.data
								.flatMap( column => column.data )
								.filter( cell => ! cell.hidden && ! cell.placeholder )
								.map( cell => cell.label )[ 0 ]
						}
					/>
				) }
			</AdaptiveCalendarHeatmap>
		);
	} finally {
		restoreTileSize();
	}

	const chart = screen.getByTestId( 'chart' );
	const number = ( name: string ) => Number( chart.getAttribute( name ) );
	const resolved = {
		columns: number( 'data-columns' ),
		showValues: chart.getAttribute( 'data-show-values' ) === 'true',
		// `undefined` until the tile has been measured, so read it as "unsized".
		width: chart.getAttribute( 'data-width' ) === 'undefined' ? null : number( 'data-width' ),
		height: chart.getAttribute( 'data-height' ) === 'undefined' ? null : number( 'data-height' ),
		lastVisibleLabel: chart.getAttribute( 'data-last-visible-label' ),
		firstRealLabel: chart.getAttribute( 'data-first-real-label' ),
		placeholders: number( 'data-placeholders' ),
		values: chart.getAttribute( 'data-values' ) ?? '',
	};

	// Unmount before returning, so a test can measure a second tile size without
	// two charts answering to the same test id.
	view.unmount();

	return resolved;
}

describe( 'AdaptiveCalendarHeatmap', () => {
	it( 'fits the grid inside a one-row tile rather than overflowing it', () => {
		const chart = chartFor( { width: 1000, height: ONE_ROW_TILE_HEIGHT } );

		// The regression this guards: the chart's own compact mode has a fixed 11px
		// cell needing ~104px of body height, so at the shipped one-row size the grid
		// overflowed and `overflow: hidden` sliced the month labels off the top and
		// the last weekday row off the bottom.
		expect( chart.height ).toBeGreaterThan( 0 );
		expect( chart.height ).toBeLessThanOrEqual( ONE_ROW_TILE_HEIGHT );
		expect( chart.columns ).toBeGreaterThan( 0 );
	} );

	it( 'sizes the grid to the exact rectangle the tile offers', () => {
		const chart = chartFor( { width: 1000, height: 300 } );

		// Not merely "greater than zero": the grid fills the tile's height exactly,
		// which is what stops it from both clipping and leaving whitespace.
		expect( chart.height ).toBe( 300 );
		expect( chart.width ).toBeGreaterThan( 0 );
	} );

	it( 'shows the per-cell numbers only once the cells are wide enough for them', () => {
		expect( chartFor( { width: 1000, height: ONE_ROW_TILE_HEIGHT } ).showValues ).toBe( false );
		expect( chartFor( { width: 1000, height: 300 } ).showValues ).toBe( true );
	} );

	it( 'grows the cells with the tile', () => {
		const short = chartFor( { width: 1000, height: 260 } );
		const tall = chartFor( { width: 1000, height: 520 } );

		// Taller tile → taller cells → wider cells (the ratio is fixed) → fewer of
		// them across the same width.
		expect( tall.height ).toBeGreaterThan( Number( short.height ) );
		expect( tall.columns ).toBeLessThan( short.columns );
	} );

	it( 'fills the tile with filler rather than stretching a short period', () => {
		const chart = chartFor( {
			width: 1000,
			height: ONE_ROW_TILE_HEIGHT,
			period: ONE_MONTH,
		} );

		// June spans six week columns, far short of what this tile draws, so the
		// grid opens backwards to fill it.
		expect( chart.columns ).toBeGreaterThan( 6 );
		expect( chart.width ).toBe( 1000 );

		// The filler carries no data of its own: only June's day is a value, and
		// June is still where the grid ends.
		expect( chart.values ).toBe( 'Mon, Jun 2, 2025:120' );
		expect( chart.lastVisibleLabel ).toBe( 'Mon, Jun 30, 2025' );
	} );

	it( 'makes the unfetched weeks filler, not no-data cells', () => {
		const chart = chartFor( {
			width: 1000,
			height: ONE_ROW_TILE_HEIGHT,
			period: ONE_MONTH,
		} );

		// The regression this guards (WOOA7S-1963): dates drawn only to fill the
		// tile were interactive no-data cells, so the heatmap told a reader there
		// was no traffic on days it had never asked about.
		expect( chart.placeholders ).toBeGreaterThan( 0 );
		expect( chart.firstRealLabel ).toBe( 'Sun, Jun 1, 2025' );
	} );

	it( 'trims the filler before the data when the tile shrinks', () => {
		const wide = chartFor( { width: 1000, height: ONE_ROW_TILE_HEIGHT, period: ONE_MONTH } );
		const narrow = chartFor( { width: 400, height: ONE_ROW_TILE_HEIGHT, period: ONE_MONTH } );

		expect( narrow.columns ).toBeLessThan( wide.columns );

		// Fewer columns must cost filler weeks, never the month itself.
		expect( narrow.values ).toBe( 'Mon, Jun 2, 2025:120' );
		expect( narrow.firstRealLabel ).toBe( 'Sun, Jun 1, 2025' );
	} );

	it( 'keeps the newest data when the period outruns the tile', () => {
		// A whole year in a tile whose cells are too big to draw all 53 columns.
		const chart = chartFor( {
			width: 1000,
			height: 300,
			valueByDay: { '2025-01-06': 5, '2025-12-29': 120 },
		} );

		expect( chart.columns ).toBeLessThan( 53 );

		// The trim spends its columns on the end of the period, so December
		// survives and January is what falls off. The regression this guards ran
		// the grid on past the data instead, leaving the surviving columns empty.
		expect( chart.values ).toBe( 'Mon, Dec 29, 2025:120' );
		expect( chart.lastVisibleLabel ).toBe( 'Wed, Dec 31, 2025' );

		// A period longer than the tile needs no filler at all.
		expect( chart.placeholders ).toBe( 0 );
	} );

	it( 'ends the grid on the period, not on today', () => {
		const chart = chartFor( { width: 240, height: ONE_ROW_TILE_HEIGHT, period: ONE_MONTH } );

		expect( chart.lastVisibleLabel ).toBe( 'Mon, Jun 30, 2025' );
	} );

	it( 'keeps a minimum number of columns in a tile too narrow for them', () => {
		// `minColumns` in the layout helper. Without it a very narrow tile resolved to
		// zero columns and fell through to rendering the entire period.
		const chart = chartFor( { width: 40, height: ONE_ROW_TILE_HEIGHT } );

		expect( chart.columns ).toBe( 6 );
	} );

	it( 'keeps growing the cells as the tile gets taller', () => {
		const columnsAt = ( height: number ) => chartFor( { width: 1000, height } ).columns;

		// The cells take the height all the way up, trading week columns for size, as
		// the prototype does at every tile it is dragged to.
		expect( columnsAt( 600 ) ).toBeLessThan( columnsAt( 300 ) );
		expect( columnsAt( 1200 ) ).toBeLessThan( columnsAt( 600 ) );
	} );

	it( 'spans the full width of the tile, leaving no band at the edge', () => {
		// An integer column count leaves width over; the cells absorb it, so the grid
		// the chart is sized to is exactly as wide as the tile.
		expect( chartFor( { width: 1000, height: 300 } ).width ).toBe( 1000 );
	} );

	it( 'falls back to the period before the tile has been measured', () => {
		const chart = chartFor( { width: 0, height: 0 } );

		// 2025 spans 53 week columns, and with no width to fill they all render.
		expect( chart.columns ).toBe( 53 );
		// Unsized while unmeasured, rather than handed a zero box or drawing values.
		expect( chart.width ).toBeNull();
		expect( chart.height ).toBeNull();
		expect( chart.showValues ).toBe( false );
	} );
} );

describe( 'AdaptiveCalendarHeatmap paging', () => {
	// Renders through the real pager overlay and stays mounted, so a test can
	// click the arrows. The tile-size stub stays installed until `restore`.
	function renderPaged( {
		width,
		height,
		period = PERIOD,
	}: {
		width: number;
		height: number;
		period?: { startDate: string; endDate: string };
	} ) {
		const restore = stubTileSize( width, height );
		render(
			<AdaptiveCalendarHeatmap valueByDay={ VALUE_BY_DAY } period={ period }>
				{ ( chartProps: AdaptiveCalendarHeatmapChartProps, pager?: CalendarHeatmapPager ) => (
					<CalendarHeatmapPagerOverlay pager={ pager }>
						<div
							data-testid="chart"
							data-columns={ chartProps.data.length }
							data-first-visible-label={
								chartProps.data
									.flatMap( column => column.data )
									.filter( cell => ! cell.hidden )
									.map( cell => cell.label )[ 0 ]
							}
							data-last-visible-label={
								chartProps.data
									.flatMap( column => column.data )
									.filter( cell => ! cell.hidden )
									.map( cell => cell.label )
									.slice( -1 )[ 0 ]
							}
						/>
					</CalendarHeatmapPagerOverlay>
				) }
			</AdaptiveCalendarHeatmap>
		);

		const read = () => {
			const chart = screen.getByTestId( 'chart' );
			return {
				columns: Number( chart.getAttribute( 'data-columns' ) ),
				firstVisibleLabel: chart.getAttribute( 'data-first-visible-label' ),
				lastVisibleLabel: chart.getAttribute( 'data-last-visible-label' ),
			};
		};

		return { read, restore };
	}

	const older = () => screen.queryByRole( 'button', { name: 'Older activity' } );
	const newer = () => screen.queryByRole( 'button', { name: 'Newer activity' } );
	// An arrow with nowhere to go is not rendered at all (per the design), so
	// "unavailable" is its absence.
	const isUnavailable = ( button: HTMLElement | null ) => button === null;

	it( 'exposes no pager when the whole period fits the tile', () => {
		const { restore } = renderPaged( {
			width: 1000,
			height: ONE_ROW_TILE_HEIGHT,
			period: ONE_MONTH,
		} );

		try {
			expect( older() ).toBeNull();
			expect( newer() ).toBeNull();
		} finally {
			restore();
		}
	} );

	it( 'pages back through the weeks the tile could not draw', async () => {
		const user = userEvent.setup();
		const { read, restore } = renderPaged( { width: 240, height: ONE_ROW_TILE_HEIGHT } );

		try {
			// The newest page shows first: nothing newer to step to, plenty older.
			// The boundaries are pinned (not merely "changed"): this width draws 15
			// week columns, so the newest page spans exactly these dates.
			expect( read() ).toMatchObject( {
				firstVisibleLabel: 'Mon, Sep 22, 2025',
				lastVisibleLabel: 'Wed, Dec 31, 2025',
			} );
			expect( isUnavailable( older() ) ).toBe( false );
			expect( isUnavailable( newer() ) ).toBe( true );

			await user.click( older()! );

			// One whole page older, contiguous with the newest page: it ends the
			// day before that page starts, and spans the same 15 columns.
			expect( read() ).toMatchObject( {
				firstVisibleLabel: 'Mon, Jun 9, 2025',
				lastVisibleLabel: 'Sun, Sep 21, 2025',
			} );
			expect( isUnavailable( newer() ) ).toBe( false );

			await user.click( newer()! );
			expect( read().lastVisibleLabel ).toBe( 'Wed, Dec 31, 2025' );
		} finally {
			restore();
		}
	} );

	it( 'clamps the oldest page to the period start and fills forward', async () => {
		const user = userEvent.setup();
		const { read, restore } = renderPaged( { width: 240, height: ONE_ROW_TILE_HEIGHT } );

		try {
			const newestColumns = read().columns;

			// Walk to the oldest page; the guard caps a runaway loop, not the data.
			for ( let clicks = 0; ! isUnavailable( older() ); clicks++ ) {
				expect( clicks ).toBeLessThan( 60 );
				await user.click( older()! );
			}

			const oldest = read();
			// The page starts on the period's first day rather than padding
			// out-of-range blanks before it, and it stays a full page wide.
			expect( oldest.firstVisibleLabel ).toBe( 'Wed, Jan 1, 2025' );
			expect( oldest.columns ).toBe( newestColumns );
			expect( isUnavailable( newer() ) ).toBe( false );

			// The last click removed the arrow that held keyboard focus; the
			// overlay hands focus to the surviving arrow so `:focus-within` (and
			// paging back) survives.
			expect( newer() ).toHaveFocus();
		} finally {
			restore();
		}
	} );

	it( 'restarts at the newest page when the period changes', async () => {
		const user = userEvent.setup();
		const restore = stubTileSize( 240, ONE_ROW_TILE_HEIGHT );

		function harness( period: { startDate: string; endDate: string } ) {
			return (
				<AdaptiveCalendarHeatmap valueByDay={ VALUE_BY_DAY } period={ period }>
					{ ( chartProps: AdaptiveCalendarHeatmapChartProps, pager?: CalendarHeatmapPager ) => (
						<CalendarHeatmapPagerOverlay pager={ pager }>
							<div
								data-testid="chart"
								data-last-visible-label={
									chartProps.data
										.flatMap( column => column.data )
										.filter( cell => ! cell.hidden )
										.map( cell => cell.label )
										.slice( -1 )[ 0 ]
								}
							/>
						</CalendarHeatmapPagerOverlay>
					) }
				</AdaptiveCalendarHeatmap>
			);
		}

		try {
			const view = render( harness( PERIOD ) );
			await user.click( older()! );
			expect( isUnavailable( newer() ) ).toBe( false );

			view.rerender( harness( { startDate: '2024-01-01', endDate: '2024-12-31' } ) );

			// Back on the newest page of the new period.
			expect( screen.getByTestId( 'chart' ) ).toHaveAttribute(
				'data-last-visible-label',
				'Tue, Dec 31, 2024'
			);
			expect( isUnavailable( newer() ) ).toBe( true );
		} finally {
			restore();
		}
	} );
} );
