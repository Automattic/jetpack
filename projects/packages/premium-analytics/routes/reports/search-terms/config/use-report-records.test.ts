import { useStatsSearchTerms } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useSearchTermsReportRecords } from './use-report-records';
import type {
	ReportParams,
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
 * Mock the shared Stats hook with the daily fixtures.
 *
 * @param comparisonReport - Optional comparison-period report.
 * @param isLoading        - Whether the report is loading.
 */
function mockSearchTermsReport(
	comparisonReport?: StatsNormalizedReport< StatsSearchTermsItem >,
	isLoading = false
) {
	mockUseStatsSearchTerms.mockReturnValue( {
		primary: { data: report },
		comparison: { data: comparisonReport },
		hasComparison: Boolean( comparisonReport ),
		isLoading,
	} as unknown as ReturnType< typeof useStatsSearchTerms > );
}

describe( 'useSearchTermsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsSearchTerms.mockReset();
	} );

	it( 'requests daily buckets and returns the aggregated table data', () => {
		// A disabled comparison must not leak cached comparison values into the table.
		mockSearchTermsReport( report );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( mockUseStatsSearchTerms ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( result.current.table.rows ).toEqual( [
			{ id: 'term:jetpack stats', term: 'jetpack stats', views: 12 },
			{ id: 'unknown-search-terms', term: 'Unknown search terms', views: 10 },
		] );
		expect( result.current.table.hasComparison ).toBe( false );
		expect( result.current.table.isLoading ).toBe( false );
	} );

	it( 'adds comparison values to matching known and encrypted rows', () => {
		const comparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			...report,
			data: report.data.map( point => ( {
				...point,
				items: point.items.map( item => ( { ...item, views: item.views - 2 } ) ),
				encrypted_search_terms: Number( point.encrypted_search_terms ) - 2,
			} ) ),
		};
		mockSearchTermsReport( comparisonReport );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
			comp: '1',
			compare_from: '2026-05-27',
			compare_to: '2026-05-28',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( result.current.table.rows ).toEqual( [
			{
				id: 'term:jetpack stats',
				term: 'jetpack stats',
				views: 12,
				previousViews: 8,
			},
			{
				id: 'unknown-search-terms',
				term: 'Unknown search terms',
				views: 10,
				previousViews: 6,
			},
		] );
		expect( result.current.table.hasComparison ).toBe( true );
	} );

	it( 'forwards loading state while comparison data is pending', () => {
		mockSearchTermsReport( undefined, true );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
			comp: '1',
			compare_from: '2026-05-27',
			compare_to: '2026-05-28',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( result.current.table.isLoading ).toBe( true );
		expect( result.current.table.hasComparison ).toBe( false );
	} );

	it( 'surfaces error and refetch from the report', () => {
		const refetch = jest.fn();
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
			isError: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsSearchTerms > );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( result.current.isError ).toBe( true );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
