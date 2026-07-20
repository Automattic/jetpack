import { useStatsSearchTerms } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useSearchTermsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsChartBucketPeriod,
	StatsNormalizedReport,
	StatsSearchTermsItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSearchTerms: jest.fn(),
} ) );

const mockUseStatsSearchTerms = useStatsSearchTerms as jest.MockedFunction<
	typeof useStatsSearchTerms
>;

const report: StatsNormalizedReport< StatsSearchTermsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-03',
			date_start: '2026-06-03T00:00:00+00:00',
			date_end: '2026-06-03T23:59:59+00:00',
			items: [
				{
					label: 'jetpack stats',
					views: 5,
					className: 'user-selectable',
					children: null,
				},
			],
			encrypted_search_terms: 4,
		},
		{
			time_interval: '2026-06-04',
			date_start: '2026-06-04T00:00:00+00:00',
			date_end: '2026-06-04T23:59:59+00:00',
			items: [
				{
					label: 'jetpack stats',
					views: 7,
					className: 'user-selectable',
					children: null,
				},
			],
			encrypted_search_terms: 6,
		},
	],
};

/**
 * Mock the shared Stats hook with the daily fixture.
 *
 * @param hasComparison - Whether comparison data is available.
 */
function mockSearchTermsReport( hasComparison = false ) {
	mockUseStatsSearchTerms.mockReturnValue( {
		primary: { data: report },
		comparison: { data: hasComparison ? report : undefined },
		hasComparison,
		isLoading: false,
	} as unknown as ReturnType< typeof useStatsSearchTerms > );
}

describe( 'useSearchTermsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsSearchTerms.mockReset();
	} );

	it( 'requests daily buckets for the shared chart and table data', () => {
		mockSearchTermsReport();
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
		};

		renderHook( () => useSearchTermsReportRecords( params, 'day' ) );

		expect( mockUseStatsSearchTerms ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
	} );

	it( 'keeps the request and table daily while grouping both chart series by week', () => {
		mockSearchTermsReport( true );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
			compare_from: '2026-05-27',
			compare_to: '2026-05-28',
		};
		const { result, rerender } = renderHook(
			( { chartPeriod }: { chartPeriod: StatsChartBucketPeriod } ) =>
				useSearchTermsReportRecords( params, chartPeriod ),
			{ initialProps: { chartPeriod: 'day' } }
		);
		const dayRows = result.current.table.rows;

		rerender( { chartPeriod: 'week' } );

		expect( mockUseStatsSearchTerms ).toHaveBeenLastCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( result.current.chart.primary.data ).toEqual( [
			expect.objectContaining( { time_interval: '2026-06-01', views: 22 } ),
		] );
		expect( result.current.chart.comparison?.data ).toEqual( [
			expect.objectContaining( { time_interval: '2026-06-01', views: 22 } ),
		] );
		expect( result.current.table.rows ).toEqual( dayRows );
	} );
} );
