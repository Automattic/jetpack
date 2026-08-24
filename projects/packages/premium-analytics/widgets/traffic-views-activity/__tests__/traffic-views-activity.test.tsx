/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import TrafficViewsActivityRender from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { HeatmapTooltipData } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// Keep visx out of jsdom while exposing the mapped series for assertions.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	return {
		...actual,
		HeatmapChartUnresponsive: ( {
			data,
			height,
			showValues,
			width,
			renderTooltip,
		}: {
			data: { data: { label?: string; value: number | null }[] }[];
			height?: number;
			showValues?: boolean;
			width?: number;
			renderTooltip?: ( data: HeatmapTooltipData ) => ReactNode;
		} ) => (
			<>
				<div
					data-testid="heatmap"
					data-columns={ data.length }
					data-day-values={ data
						.flatMap( column => column.data )
						.filter( cell => cell.value !== null )
						.map( cell => `${ cell.label }:${ cell.value }` )
						.join( '|' ) }
					data-height={ String( height ) }
					data-show-values={ String( showValues ) }
					data-width={ String( width ) }
				/>
				<div data-testid="tooltip-empty">
					{ renderTooltip?.( {
						value: null,
						cellLabel: 'Mon, Jun 2, 2025',
						row: 0,
						column: 0,
					} ) }
				</div>
				<div data-testid="tooltip-singular">
					{ renderTooltip?.( {
						value: 1,
						cellLabel: 'Tue, Jun 3, 2025',
						row: 1,
						column: 0,
					} ) }
				</div>
				<div data-testid="tooltip-plural">
					{ renderTooltip?.( {
						value: 1234,
						cellLabel: 'Wed, Jun 4, 2025',
						row: 2,
						column: 0,
					} ) }
				</div>
			</>
		),
	};
} );

// Spread the real module: `WidgetRoot` and the toolkit helpers import from it too.
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVisits: jest.fn(),
} ) );

const mockUseStatsVisits = jest.mocked( useStatsVisits );

const REPORT_PARAMS = {
	from: '2025-01-01',
	to: '2025-12-31',
	interval: 'day',
} as unknown as ReportParams;

function visitsResult( primaryData: unknown, overrides: Record< string, unknown > = {} ) {
	return {
		primary: { data: primaryData },
		comparison: { data: undefined },
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: !! primaryData,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsVisits >;
}

function report( days: Array< [ string, number ] > ) {
	return {
		summary: {},
		data: days.map( ( [ time_interval, views ] ) => ( { time_interval, views } ) ),
	};
}

function renderWidget( reportParams: ReportParams = REPORT_PARAMS ) {
	return render( <TrafficViewsActivityRender attributes={ { reportParams } } /> );
}

function chartDayValues() {
	return screen.getByTestId( 'heatmap' ).getAttribute( 'data-day-values' );
}

// The fetch window is sized from the viewport: the tile is never wider, and the
// grid only renders the week columns that fit.
function setViewportWidth( width: number ) {
	Object.defineProperty( window, 'innerWidth', { value: width, configurable: true } );
}

// jsdom reports every element as 0x0, so the tile has to be faked to reach the
// expanded branch. Returns a restore callback.
function stubTileSize( width: number, height: number ) {
	const original = Element.prototype.getBoundingClientRect;

	Element.prototype.getBoundingClientRect = () => ( { width, height } ) as DOMRect;

	return () => {
		Element.prototype.getBoundingClientRect = original;
	};
}

describe( 'TrafficViewsActivityWidget', () => {
	const originalInnerWidth = window.innerWidth;

	beforeEach( () => {
		mockUseStatsVisits.mockReset();
		mockUseStatsVisits.mockReturnValue( visitsResult( report( [ [ '2025-06-02', 120 ] ] ) ) );
		setViewportWidth( 1024 );
	} );

	afterEach( () => {
		setViewportWidth( originalInnerWidth );
	} );

	describe( 'request parameters', () => {
		it( 'passes the shared history window as from/to, the fields stats/visits reads', () => {
			renderWidget();

			const params = mockUseStatsVisits.mock.calls[ 0 ][ 0 ] as Record< string, unknown >;

			expect( params ).toMatchObject( {
				from: '2023-12-31',
				to: '2025-12-31',
				period: 'day',
				stat_fields: 'views',
			} );
			expect( params ).not.toHaveProperty( 'startDate' );
			expect( params ).not.toHaveProperty( 'endDate' );
		} );

		it( 'caps an all-time range at the years the viewport can render', () => {
			renderWidget( {
				...REPORT_PARAMS,
				from: '2018-01-01',
				to: '2026-08-10',
			} as unknown as ReportParams );

			// 1024px holds 76 compact columns — 532 days, rounded up to two years.
			expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				from: '2024-08-09',
				to: '2026-08-10',
			} );
		} );

		it( 'requests more history on a wider viewport', () => {
			setViewportWidth( 2560 );
			renderWidget( {
				...REPORT_PARAMS,
				from: '2018-01-01',
				to: '2026-08-10',
			} as unknown as ReportParams );

			// 194 compact columns fit, so four years are worth requesting.
			expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				from: '2022-08-08',
				to: '2026-08-10',
			} );
		} );

		it( 'updates the request window when the viewport is resized', () => {
			renderWidget( {
				...REPORT_PARAMS,
				from: '2018-01-01',
				to: '2026-08-10',
			} as unknown as ReportParams );

			setViewportWidth( 2560 );
			fireEvent.resize( window );

			const lastCall = mockUseStatsVisits.mock.calls[ mockUseStatsVisits.mock.calls.length - 1 ];
			expect( lastCall[ 0 ] ).toMatchObject( {
				from: '2022-08-08',
				to: '2026-08-10',
			} );
		} );

		it( 'stops widening the window past the maximum', () => {
			setViewportWidth( 100000 );
			renderWidget( {
				...REPORT_PARAMS,
				from: '2000-01-01',
				to: '2026-08-10',
			} as unknown as ReportParams );

			expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				from: '2020-08-06',
				to: '2026-08-10',
			} );
		} );

		it( 'floors a shorter selection to the shared history window', () => {
			renderWidget( {
				...REPORT_PARAMS,
				from: '2024-01-01',
				to: '2024-12-31',
			} as unknown as ReportParams );

			expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				from: '2022-12-31',
				to: '2024-12-31',
			} );
		} );

		it( 'drops comparison params — the period control offers no comparison', () => {
			renderWidget( {
				...REPORT_PARAMS,
				comp: '1',
				compare_from: '2024-01-01',
				compare_to: '2024-12-31',
			} as unknown as ReportParams );

			const params = mockUseStatsVisits.mock.calls[ 0 ][ 0 ] as Record< string, unknown >;

			expect( params.comp ).toBeUndefined();
			expect( params.compare_from ).toBeUndefined();
		} );
	} );

	describe( 'day mapping', () => {
		it( 'reads the day key from time_interval, not date', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult(
					report( [
						[ '2025-06-02', 120 ],
						[ '2025-06-03', 340 ],
					] )
				)
			);
			renderWidget();

			expect( chartDayValues() ).toContain( 'Mon, Jun 2, 2025:120' );
			expect( chartDayValues() ).toContain( 'Tue, Jun 3, 2025:340' );
		} );

		it( 'renders a zero-view day as a blank cell rather than a 0 label', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult(
					report( [
						[ '2025-06-02', 0 ],
						[ '2025-06-03', 340 ],
					] )
				)
			);
			renderWidget();

			expect( chartDayValues() ).not.toContain( 'Mon, Jun 2, 2025:0' );
			expect( chartDayValues() ).toContain( 'Tue, Jun 3, 2025:340' );
		} );

		it( 'spans the selected period even though the payload is sparse', () => {
			renderWidget();

			// The 2025 selection densifies to 53 week columns. Not the fetch
			// window's 106: the request floors at the shared history window, but
			// the grid must not draw (or let the pager reach) dates outside the
			// selection — picking 2025 must not page into 2024.
			expect( screen.getByTestId( 'heatmap' ) ).toHaveAttribute( 'data-columns', '53' );
		} );
	} );

	describe( 'states', () => {
		it( 'shows the empty state when the period has no views at all', () => {
			mockUseStatsVisits.mockReturnValue( visitsResult( report( [ [ '2025-06-02', 0 ] ] ) ) );
			renderWidget();

			expect( screen.getByText( 'No views in this period.' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'heatmap' ) ).not.toBeInTheDocument();
		} );

		it( 'shows the empty state when only the fetch window surplus has views', () => {
			// The 2025 selection draws only 2025, but the request reaches back a
			// further year; those older views must not suppress the empty state.
			mockUseStatsVisits.mockReturnValue( visitsResult( report( [ [ '2024-03-05', 120 ] ] ) ) );
			renderWidget();

			expect( screen.getByText( 'No views in this period.' ) ).toBeInTheDocument();
			expect( screen.queryByTestId( 'heatmap' ) ).not.toBeInTheDocument();
		} );

		it( 'names the days requested when the period outran the window', () => {
			mockUseStatsVisits.mockReturnValue( visitsResult( report( [] ) ) );
			renderWidget( {
				...REPORT_PARAMS,
				from: '2018-01-01',
				to: '2026-08-10',
			} as unknown as ReportParams );

			// The request only covers 2024-08-09 onwards, so an all-time period with
			// older traffic would make "No views in this period." a lie.
			expect(
				screen.getByText( 'No views between Aug 9, 2024 and Aug 10, 2026.' )
			).toBeInTheDocument();
		} );

		it( 'speaks for the whole period when the window covered it', () => {
			mockUseStatsVisits.mockReturnValue( visitsResult( report( [] ) ) );
			// 1024px buys two years, so this period ends exactly on the window start.
			renderWidget( {
				...REPORT_PARAMS,
				from: '2024-08-09',
				to: '2026-08-10',
			} as unknown as ReportParams );

			expect( screen.getByText( 'No views in this period.' ) ).toBeInTheDocument();
		} );

		it( 'keeps rendering the grid when a refetch fails with data on screen', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult( report( [ [ '2025-06-02', 120 ] ] ), { isError: true } )
			);
			renderWidget();

			expect( screen.getByTestId( 'heatmap' ) ).toBeInTheDocument();
		} );

		it( 'shows a retryable error when the initial request fails', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult( undefined, {
					isError: true,
					error: { error: 'no_connection', status: 403 },
				} )
			);
			renderWidget();

			expect(
				screen.getByText( "We couldn't load your traffic activity. Please try again in a moment." )
			).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		} );

		it( 'shows a permission error without retrying', () => {
			mockUseStatsVisits.mockReturnValue(
				visitsResult( undefined, {
					isError: true,
					error: { error: 'unauthorized', status: 403 },
				} )
			);
			renderWidget();

			expect( screen.getByText( "You don't have access to this data." ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'cell presentation', () => {
		it( 'fits the grid inside the shipped one-row tile', () => {
			// A 200px grid row less the widget's own chrome — the size this widget
			// ships at, and the tightest it has to fit. The grid is sized to the tile
			// so it cannot overflow and have its month labels clipped away.
			const restoreTileSize = stubTileSize( 1000, 86 );

			try {
				renderWidget();
			} finally {
				restoreTileSize();
			}

			const heatmap = screen.getByTestId( 'heatmap' );

			expect( Number( heatmap.getAttribute( 'data-height' ) ) ).toBeLessThanOrEqual( 86 );
			// Cells this small have no room for a number.
			expect( heatmap ).not.toHaveAttribute( 'data-show-values', 'true' );
		} );

		it( 'labels the cells once the tile is tall enough, trimming to the columns that fit', () => {
			const restoreTileSize = stubTileSize( 1000, 300 );

			try {
				renderWidget();
			} finally {
				restoreTileSize();
			}

			const heatmap = screen.getByTestId( 'heatmap' );

			expect( heatmap ).toHaveAttribute( 'data-show-values', 'true' );
			// The 53-week window does not fit at this cell size, so the oldest
			// columns drop instead of the cells shrinking.
			expect( Number( heatmap.getAttribute( 'data-columns' ) ) ).toBeGreaterThan( 0 );
			expect( Number( heatmap.getAttribute( 'data-columns' ) ) ).toBeLessThan( 53 );
		} );

		it( 'keeps growing the cells as the tile gets taller', () => {
			const columnsAt = ( height: number ) => {
				const restoreTileSize = stubTileSize( 1000, height );

				try {
					renderWidget();
				} finally {
					restoreTileSize();
				}

				const columns = Number( screen.getByTestId( 'heatmap' ).getAttribute( 'data-columns' ) );
				screen.getByTestId( 'heatmap' ).remove();

				return columns;
			};

			// The cells take the height, so a taller tile trades week columns for cell
			// size — as the prototype does, all the way up.
			expect( columnsAt( 600 ) ).toBeLessThan( columnsAt( 300 ) );
			expect( columnsAt( 1200 ) ).toBeLessThan( columnsAt( 600 ) );
		} );

		it( 'spans the full width of the tile, leaving no band at the edge', () => {
			const restoreTileSize = stubTileSize( 1000, 300 );

			try {
				renderWidget();
			} finally {
				restoreTileSize();
			}

			// An integer column count leaves width over; the cells absorb it rather
			// than the grid stopping short of the edge.
			expect( screen.getByTestId( 'heatmap' ) ).toHaveAttribute( 'data-width', '1000' );
		} );

		it( 'fills a short selection from the shared fetched history', () => {
			// The picker selects one month, but both calendar widgets request the same
			// viewport-sized history floor.
			const restoreTileSize = stubTileSize( 1000, 110 );

			try {
				renderWidget( {
					...REPORT_PARAMS,
					from: '2025-06-01',
					to: '2025-06-30',
				} as unknown as ReportParams );
			} finally {
				restoreTileSize();
			}

			const heatmap = screen.getByTestId( 'heatmap' );

			// The displayed columns stay inside that fetched history window.
			expect( Number( heatmap.getAttribute( 'data-columns' ) ) ).toBeGreaterThan( 5 );
			expect( chartDayValues() ).toBe( 'Mon, Jun 2, 2025:120' );
		} );

		it( 'keeps the empty state scoped to the period, not the visible weeks', () => {
			// A tall tile shows ~16 recent weeks, so June's views fall outside the
			// visible window — the response still has views, so this is not empty.
			const restoreTileSize = stubTileSize( 1000, 300 );

			try {
				renderWidget( {
					...REPORT_PARAMS,
					from: '2025-01-01',
					to: '2025-12-31',
				} as unknown as ReportParams );
			} finally {
				restoreTileSize();
			}

			expect( screen.getByTestId( 'heatmap' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'No views in this period.' ) ).not.toBeInTheDocument();
		} );

		it( 'renders empty, singular, and formatted plural tooltips', () => {
			renderWidget();

			expect( screen.getByTestId( 'tooltip-empty' ) ).toHaveTextContent(
				'No viewsMon, Jun 2, 2025'
			);
			expect( screen.getByTestId( 'tooltip-singular' ) ).toHaveTextContent(
				'1 viewTue, Jun 3, 2025'
			);
			expect( screen.getByTestId( 'tooltip-plural' ) ).toHaveTextContent(
				'1,234 viewsWed, Jun 4, 2025'
			);
		} );
	} );
} );
