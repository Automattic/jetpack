/**
 * External dependencies
 */
import { useStatsVisits } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useStatsTotalMetric } from '../use-stats-total-metric';
import type { ReportParams } from '@jetpack-premium-analytics/data';

// Spread the real module: the toolkit's `helpers` barrel also imports from it
// (`build-metric-tab` → `localTZDate`), so a bare factory would blank that out.
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVisits: jest.fn(),
} ) );

const mockUseStatsVisits = useStatsVisits as jest.MockedFunction< typeof useStatsVisits >;

const REPORT_PARAMS = {
	from: '2026-07-01',
	to: '2026-07-31',
	interval: 'day',
} as unknown as ReportParams;

const COMPARING_PARAMS = {
	...REPORT_PARAMS,
	comp: '1',
	compare_from: '2026-06-01',
	compare_to: '2026-06-30',
	compare_preset: 'previous_period',
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

const REPORT = {
	summary: { views: 30, visitors: 7 },
	data: [
		{ date_start: '2026-07-01', views: 10, visitors: 4 },
		{ date_start: '2026-07-02', views: 20, visitors: 5 },
	],
};

describe( 'useStatsTotalMetric', () => {
	beforeEach( () => {
		mockUseStatsVisits.mockReset();
	} );

	it( 'requests both traffic fields so the query is shared with the traffic chart', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderHook( () => useStatsTotalMetric( REPORT_PARAMS, 'views' ) );

		expect( mockUseStatsVisits ).toHaveBeenCalledWith(
			expect.objectContaining( { stat_fields: 'views,visitors', period: 'day' } )
		);
	} );

	it( 'strips comparison fields so the unused comparison request never runs', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderHook( () => useStatsTotalMetric( COMPARING_PARAMS, 'views' ) );

		const params = mockUseStatsVisits.mock.calls[ 0 ][ 0 ];
		expect( params ).not.toHaveProperty( 'comp' );
		expect( params ).not.toHaveProperty( 'compare_from' );
		expect( params ).not.toHaveProperty( 'compare_to' );
		expect( params ).not.toHaveProperty( 'compare_preset' );
	} );

	it( 'clamps the bucket granularity to the coarsest offered period', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		renderHook( () =>
			useStatsTotalMetric( { ...REPORT_PARAMS, interval: 'year' } as ReportParams, 'views' )
		);

		expect( mockUseStatsVisits ).toHaveBeenCalledWith(
			expect.objectContaining( { period: 'month' } )
		);
	} );

	it( 'reads the headline from the report summary rather than re-summing buckets', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		const { result } = renderHook( () => useStatsTotalMetric( REPORT_PARAMS, 'visitors' ) );

		// Buckets hold 4 and 5; the summary is the source of truth.
		expect( result.current.total ).toBe( 7 );
	} );

	it( 'maps the selected field to sparkline points', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT ) );

		const { result } = renderHook( () => useStatsTotalMetric( REPORT_PARAMS, 'views' ) );

		expect( result.current.points ).toEqual( [ 10, 20 ] );
	} );

	it( 'reports zero and no points when the report has not arrived', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( undefined, { isLoading: true } ) );

		const { result } = renderHook( () => useStatsTotalMetric( REPORT_PARAMS, 'views' ) );

		expect( result.current.total ).toBe( 0 );
		expect( result.current.points ).toEqual( [] );
		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'surfaces isError only when there are no rows left to show', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( REPORT, { isError: true } ) );

		const { result } = renderHook( () => useStatsTotalMetric( REPORT_PARAMS, 'views' ) );

		expect( result.current.isError ).toBe( false );
	} );

	it( 'surfaces isError when the fetch failed with nothing to show', () => {
		mockUseStatsVisits.mockReturnValue( visitsResult( undefined, { isError: true } ) );

		const { result } = renderHook( () => useStatsTotalMetric( REPORT_PARAMS, 'views' ) );

		expect( result.current.isError ).toBe( true );
	} );
} );
