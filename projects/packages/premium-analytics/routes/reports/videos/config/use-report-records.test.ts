import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useVideosReportRecords } from './use-report-records';
import type { ReportParams, StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVideoPlays: jest.fn(),
} ) );

const mockUseStatsVideoPlays = useStatsVideoPlays as jest.MockedFunction<
	typeof useStatsVideoPlays
>;

const summaryRows: StatsVideoPlaysComparisonItem[] = [
	{
		id: 441,
		label: 'Demo',
		plays: 13,
		previousPlays: 0,
		impressions: 22,
		previousImpressions: 0,
		watch_time: 0.04,
		retention_rate: 64.5,
		link: null,
		children: null,
	},
	{
		id: 999,
		label: 'Unmatched video',
		plays: 3,
		impressions: 5,
		watch_time: 0.01,
		retention_rate: 50,
		link: null,
		children: null,
	},
];

const params: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

/**
 * Configure the complete-stats summary hook call.
 *
 * @param options                   - Mocked request state and comparison rows.
 * @param options.rows              - Comparison-aware summary table rows.
 * @param options.hasComparison     - Whether at least one summary row matched.
 * @param options.isLoading         - Whether the summary request is initially loading.
 * @param options.isFetching        - Whether either summary range is actively fetching.
 * @param options.primaryIsError    - Whether the primary-period request failed.
 * @param options.comparisonIsError - Whether the comparison-period request failed.
 * @return The summary refetch mock.
 */
function mockQuery( {
	rows = summaryRows,
	hasComparison = false,
	isLoading = false,
	isFetching = false,
	primaryIsError = false,
	comparisonIsError = false,
}: {
	rows?: StatsVideoPlaysComparisonItem[];
	hasComparison?: boolean;
	isLoading?: boolean;
	isFetching?: boolean;
	primaryIsError?: boolean;
	comparisonIsError?: boolean;
} = {} ) {
	const refetch = jest.fn();

	mockUseStatsVideoPlays.mockReturnValue( {
		primary: { isError: primaryIsError },
		comparison: { isError: comparisonIsError },
		comparisonRows: { rows, hasComparison },
		hasComparison,
		isLoading,
		isFetching,
		isError: primaryIsError || comparisonIsError,
		refetch,
	} as unknown as ReturnType< typeof useStatsVideoPlays > );

	return refetch;
}

describe( 'useVideosReportRecords', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'uses one comparison-aware complete-stats request with no daily enrichment query', () => {
		mockQuery();

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledTimes( 1 );
		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 1,
			complete_stats: 1,
		} );
		expect( result.current.rows ).toBe( summaryRows );
	} );

	it( 'preserves comparison metrics and explicit zero previous values', () => {
		mockQuery( { hasComparison: true } );
		const comparisonParams: ReportParams = {
			...params,
			comp: '1',
			compare_from: '2026-07-07',
			compare_to: '2026-07-08',
		};

		const { result } = renderHook( () => useVideosReportRecords( comparisonParams ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith( {
			...comparisonParams,
			max: 0,
			summarize: 1,
			complete_stats: 1,
		} );
		expect( result.current.rows[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 441,
				plays: 13,
				previousPlays: 0,
				impressions: 22,
				previousImpressions: 0,
			} )
		);
		expect( result.current.rows[ 1 ].previousPlays ).toBeUndefined();
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'propagates initial loading and active fetching independently', () => {
		mockQuery( { isLoading: true, isFetching: true } );

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.isLoading ).toBe( true );
		expect( result.current.isFetching ).toBe( true );
	} );

	it( 'reports errors and refetches the primary and comparison summary queries', async () => {
		const refetch = mockQuery( { primaryIsError: true, comparisonIsError: true } );

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.isError ).toBe( true );
		await result.current.refetch();
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not surface an error when only the comparison summary request fails', () => {
		mockQuery( { comparisonIsError: true } );

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.isError ).toBe( false );
		expect( result.current.rows ).toBe( summaryRows );
	} );

	it( 'surfaces an error when the primary summary request fails', () => {
		mockQuery( { primaryIsError: true } );

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.isError ).toBe( true );
	} );
} );
