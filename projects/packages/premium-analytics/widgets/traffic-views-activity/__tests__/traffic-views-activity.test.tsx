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

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

// Keep visx out of jsdom while exposing the mapped series for assertions.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );

	return {
		...actual,
		HeatmapChartUnresponsive: ( { data }: { data: { data: { value: number | null }[] }[] } ) => (
			<div
				data-testid="heatmap"
				data-columns={ data.length }
				data-values={ data
					.flatMap( column => column.data.map( cell => cell.value ) )
					.filter( value => value !== null )
					.join( ',' ) }
			/>
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

function chartValues() {
	return screen.getByTestId( 'heatmap' ).getAttribute( 'data-values' );
}

describe( 'TrafficViewsActivityWidget', () => {
	beforeEach( () => {
		mockUseStatsVisits.mockReset();
		mockUseStatsVisits.mockReturnValue( visitsResult( report( [ [ '2025-06-02', 120 ] ] ) ) );
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

		it( 'caps an all-time range at the most recent year', () => {
			renderWidget( {
				...REPORT_PARAMS,
				from: '2021-01-01',
				to: '2026-08-10',
			} as unknown as ReportParams );

			expect( mockUseStatsVisits.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
				from: '2025-08-10',
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

			expect( chartValues() ).toBe( '120,340' );
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

			expect( chartValues() ).toBe( '340' );
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
	} );
} );
