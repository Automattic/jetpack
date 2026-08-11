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
			compact,
			showValues,
			renderTooltip,
		}: {
			data: { data: { label?: string; value: number | null }[] }[];
			compact?: boolean;
			showValues?: boolean;
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
					data-compact={ String( Boolean( compact ) ) }
					data-show-values={ String( showValues ) }
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
		it( 'renders compact squares in a tile too short for labelled cells', () => {
			renderWidget();

			// jsdom reports no height, which is below the expanded threshold.
			expect( screen.getByTestId( 'heatmap' ) ).toHaveAttribute( 'data-compact', 'true' );
			expect( screen.getByTestId( 'heatmap' ) ).not.toHaveAttribute( 'data-show-values', 'true' );
		} );

		it( 'labels the cells once the tile is tall enough, trimming to the columns that fit', () => {
			const restoreTileSize = stubTileSize( 1000, 300 );

			try {
				renderWidget();
			} finally {
				restoreTileSize();
			}

			const heatmap = screen.getByTestId( 'heatmap' );

			expect( heatmap ).toHaveAttribute( 'data-compact', 'false' );
			expect( heatmap ).toHaveAttribute( 'data-show-values', 'true' );
			// The 53-week window does not fit at this cell size, so the oldest
			// columns drop instead of the cells shrinking.
			expect( Number( heatmap.getAttribute( 'data-columns' ) ) ).toBeGreaterThan( 0 );
			expect( Number( heatmap.getAttribute( 'data-columns' ) ) ).toBeLessThan( 53 );
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
