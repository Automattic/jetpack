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
	summary: {
		encrypted_search_terms: 10,
		other_search_terms: 25,
	},
	data: [
		{
			time_interval: '2026-06-04',
			date_start: '2026-06-03T00:00:00+00:00',
			date_end: '2026-06-04T23:59:59+00:00',
			items: [
				{
					label: 'jetpack stats',
					views: 12,
					className: 'user-selectable',
					children: null,
				},
			],
		},
	],
};

type MockSearchTermsReportOptions = {
	comparisonReport?: StatsNormalizedReport< StatsSearchTermsItem >;
	primaryLoading?: boolean;
	primaryFetching?: boolean;
	comparisonLoading?: boolean;
	comparisonFetching?: boolean;
	comparisonSuccess?: boolean;
	comparisonPlaceholder?: boolean;
	comparisonError?: boolean;
};

/**
 * Mock the shared Stats hook with summarized fixtures and query state.
 *
 * @param options                       - Mock report options.
 * @param options.comparisonReport      - Optional comparison-period report.
 * @param options.primaryLoading        - Whether the primary query is initially loading.
 * @param options.primaryFetching       - Whether the primary query is actively fetching.
 * @param options.comparisonLoading     - Whether the comparison query is initially loading.
 * @param options.comparisonFetching    - Whether the comparison query is actively fetching.
 * @param options.comparisonSuccess     - Whether the comparison query succeeded.
 * @param options.comparisonPlaceholder - Whether comparison data is a placeholder.
 * @param options.comparisonError       - Whether the comparison query failed.
 */
function mockSearchTermsReport( {
	comparisonReport,
	primaryLoading = false,
	primaryFetching = false,
	comparisonLoading = false,
	comparisonFetching = false,
	comparisonSuccess = comparisonReport !== undefined,
	comparisonPlaceholder = false,
	comparisonError = false,
}: MockSearchTermsReportOptions = {} ) {
	mockUseStatsSearchTerms.mockReturnValue( {
		primary: {
			data: report,
			isLoading: primaryLoading,
			isFetching: primaryFetching,
			isSuccess: ! primaryLoading,
		},
		comparison: {
			data: comparisonReport,
			isLoading: comparisonLoading,
			isFetching: comparisonFetching,
			isSuccess: comparisonSuccess,
			isPlaceholderData: comparisonPlaceholder,
			isError: comparisonError,
		},
		hasComparison: Boolean( comparisonReport ),
	} as unknown as ReturnType< typeof useStatsSearchTerms > );
}

describe( 'useSearchTermsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsSearchTerms.mockReset();
	} );

	it( 'requests the summarized legacy range and returns its table data', () => {
		// A disabled comparison must not leak cached comparison values into the table.
		mockSearchTermsReport( { comparisonReport: report } );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( mockUseStatsSearchTerms ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 1,
			period: 'day',
		} );
		expect( result.current.table.rows ).toEqual( [
			{ id: 'term:jetpack stats', term: 'jetpack stats', views: 12 },
			{ id: 'unknown-search-terms', term: 'Unknown search terms', views: 10 },
		] );
		expect( result.current.table.hasComparison ).toBe( false );
		expect( result.current.table.isLoading ).toBe( false );
		expect( result.current.table.isFetching ).toBe( false );
	} );

	it( 'adds comparison values to matching known and encrypted rows', () => {
		const comparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			...report,
			summary: {
				...report.summary,
				encrypted_search_terms: 6,
			},
			data: report.data.map( point => ( {
				...point,
				items: point.items.map( item => ( { ...item, views: 8 } ) ),
			} ) ),
		};
		mockSearchTermsReport( { comparisonReport } );
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

	it( 'treats an absent term as zero after comparison succeeds', () => {
		const comparisonReport: StatsNormalizedReport< StatsSearchTermsItem > = {
			summary: { encrypted_search_terms: 0 },
			data: [
				{
					...report.data[ 0 ],
					items: [
						{
							label: 'comparison-only term',
							views: 9,
							className: 'user-selectable',
							children: null,
						},
					],
				},
			],
		};
		mockSearchTermsReport( { comparisonReport } );
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
				previousViews: 0,
			},
			{
				id: 'unknown-search-terms',
				term: 'Unknown search terms',
				views: 10,
				previousViews: 0,
			},
		] );
		expect( result.current.table.hasComparison ).toBe( true );
	} );

	it( 'forwards initial loading while comparison data is pending', () => {
		mockSearchTermsReport( {
			comparisonLoading: true,
			comparisonFetching: true,
			comparisonSuccess: false,
		} );
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
		expect( result.current.table.isFetching ).toBe( true );
		expect( result.current.table.hasComparison ).toBe( false );
	} );

	it( 'does not use stale placeholder comparison data while actively fetching', () => {
		mockSearchTermsReport( {
			comparisonReport: report,
			comparisonFetching: true,
			comparisonSuccess: true,
			comparisonPlaceholder: true,
		} );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
			comp: '1',
			compare_from: '2026-05-27',
			compare_to: '2026-05-28',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( result.current.table.isLoading ).toBe( false );
		expect( result.current.table.isFetching ).toBe( true );
		expect( result.current.table.hasComparison ).toBe( false );
		expect( result.current.table.rows ).not.toEqual(
			expect.arrayContaining( [ expect.objectContaining( { previousViews: expect.anything() } ) ] )
		);
	} );

	it( 'does not treat a failed comparison as zero', () => {
		mockSearchTermsReport( {
			comparisonReport: report,
			comparisonSuccess: false,
			comparisonError: true,
		} );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
			comp: '1',
			compare_from: '2026-05-27',
			compare_to: '2026-05-28',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( result.current.table.hasComparison ).toBe( false );
		expect( result.current.table.rows ).not.toEqual(
			expect.arrayContaining( [ expect.objectContaining( { previousViews: 0 } ) ] )
		);
	} );

	it( 'sets isError when the primary query fails', () => {
		const refetch = jest.fn();
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: { data: undefined, isLoading: false, isFetching: false, isError: true },
			comparison: { data: undefined, isLoading: false, isFetching: false, isError: false },
			hasComparison: false,
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

	it( 'does not set isError for a comparison-only failure, and still returns primary rows', () => {
		const refetch = jest.fn();
		mockUseStatsSearchTerms.mockReturnValue( {
			primary: {
				data: report,
				isLoading: false,
				isFetching: false,
				isError: false,
				isSuccess: true,
			},
			comparison: {
				data: undefined,
				isLoading: false,
				isFetching: false,
				isSuccess: false,
				isPlaceholderData: false,
				isError: true,
			},
			hasComparison: true,
			refetch,
		} as unknown as ReturnType< typeof useStatsSearchTerms > );
		const params: ReportParams = {
			from: '2026-06-03',
			to: '2026-06-04',
			interval: 'day',
			comp: '1',
			compare_from: '2026-05-27',
			compare_to: '2026-05-28',
		};

		const { result } = renderHook( () => useSearchTermsReportRecords( params ) );

		expect( result.current.isError ).toBe( false );
		expect( result.current.table.rows ).toEqual( [
			{ id: 'term:jetpack stats', term: 'jetpack stats', views: 12 },
			{ id: 'unknown-search-terms', term: 'Unknown search terms', views: 10 },
		] );
		expect( result.current.table.hasComparison ).toBe( false );
		expect( result.current.refetch ).toBe( refetch );
	} );
} );
