/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { AdaptiveCalendarHeatmap } from '../adaptive-calendar-heatmap';
import type { AdaptiveCalendarHeatmapChartProps } from '../adaptive-calendar-heatmap';

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
}: {
	width: number;
	height: number;
	period?: { startDate: string; endDate: string };
} ) {
	const restoreTileSize = stubTileSize( width, height );
	let view;

	try {
		view = render(
			<AdaptiveCalendarHeatmap valueByDay={ VALUE_BY_DAY } period={ period }>
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
								.filter( cell => ! cell.hidden )
								.map( cell => cell.label )
								.slice( -1 )[ 0 ]
						}
						data-values={ chartProps.data
							.flatMap( column => column.data )
							.filter( cell => cell.value !== null )
							.map( cell => `${ cell.label }:${ cell.value }` )
							.join( '|' ) }
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

	it( 'never renders unfetched dates before the period', () => {
		const chart = chartFor( {
			width: 1000,
			height: ONE_ROW_TILE_HEIGHT,
			period: ONE_MONTH,
		} );

		// June spans six week columns. A stale fetch window must not turn earlier,
		// unfetched dates into interactive no-data cells just to fill the tile.
		expect( chart.columns ).toBe( 6 );
		expect( chart.width ).toBeLessThan( 1000 );
		expect( chart.values ).toBe( 'Mon, Jun 2, 2025:120' );
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
