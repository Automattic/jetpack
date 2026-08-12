/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
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
				{ /* Probed by grid position: the widget maps a blank cell back to its
				    day to tell a day with no views from unrequested filler. */ }
				<div data-testid="tooltip-oldest">
					{ renderTooltip?.( {
						value: null,
						cellLabel: data[ 0 ]?.data[ 0 ]?.label,
						row: 0,
						column: 0,
					} ) }
				</div>
				<div data-testid="tooltip-newest">
					{ renderTooltip?.( {
						value: null,
						cellLabel: data[ data.length - 1 ]?.data[ 0 ]?.label,
						row: 0,
						column: data.length - 1,
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
		it( 'passes the window as from/to, the fields stats/visits actually reads', () => {
			renderWidget();

			const params = mockUseStatsVisits.mock.calls[ 0 ][ 0 ] as Record< string, unknown >;

			expect( params ).toMatchObject( {
				from: '2025-01-01',
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

		it( 'keeps a selected leap year whole', () => {
			renderWidget( {
				...REPORT_PARAMS,
				from: '2024-01-01',
				to: '2024-12-31',
			} as unknown as ReportParams );

			expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				from: '2024-01-01',
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

		it( 'spans the whole window even though the payload is sparse', () => {
			renderWidget();

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

		it( 'names the days requested when the cap clipped the period', () => {
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

		it( 'speaks for the whole period when the cap did not clip it', () => {
			mockUseStatsVisits.mockReturnValue( visitsResult( report( [] ) ) );
			// 1024px buys two years, so this period ends exactly on the cap.
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

		it( 'pads a period shorter than the tile instead of leaving it part-filled', () => {
			// One month selected: five week columns of data in a tile with room for
			// many more.
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

			// The columns the width can hold, not the five the period holds.
			expect( Number( heatmap.getAttribute( 'data-columns' ) ) ).toBeGreaterThan( 5 );
			// The padding carries no values — only June's day is populated.
			expect( chartDayValues() ).toBe( 'Mon, Jun 2, 2025:120' );
		} );

		it( 'keeps the empty state scoped to the period, not the visible weeks', () => {
			// A tall tile shows ~16 weeks, so June's views fall outside the padding
			// window — the period still has views, so this is not the empty state.
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

		it( 'renders singular and formatted plural tooltips', () => {
			renderWidget();

			expect( screen.getByTestId( 'tooltip-singular' ) ).toHaveTextContent(
				'1 viewTue, Jun 3, 2025'
			);
			expect( screen.getByTestId( 'tooltip-plural' ) ).toHaveTextContent(
				'1,234 viewsWed, Jun 4, 2025'
			);
		} );

		it( 'tells a day with no views from a padding day the request never covered', () => {
			// One month selected in a tile with room for many more weeks, so the oldest
			// columns are padding.
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

			// Padding, months before the selected June: masked, not measured.
			expect( screen.getByTestId( 'tooltip-oldest' ) ).toHaveTextContent( 'No data' );
			// Inside the request, so a blank cell there really is a day without views.
			expect( screen.getByTestId( 'tooltip-newest' ) ).toHaveTextContent( 'No views' );
		} );

		it( 'counts the columns from the grid the chart is given, not the one built', () => {
			// Two days selected in a wide tile: everything but the newest column is
			// filler, and the request is too short to survive an off-by-a-column read
			// of the grid — Monday 2025-06-30 is the only requested day in row 0.
			const restoreTileSize = stubTileSize( 1000, 110 );

			try {
				renderWidget( {
					...REPORT_PARAMS,
					from: '2025-06-29',
					to: '2025-06-30',
				} as unknown as ReportParams );
			} finally {
				restoreTileSize();
			}

			expect( screen.getByTestId( 'tooltip-newest' ) ).toHaveTextContent( 'No views' );
		} );
	} );
} );
