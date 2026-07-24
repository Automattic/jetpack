import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useVideosReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsVideoPlaysComparisonItem,
	StatsVideoPlaysItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVideoPlays: jest.fn(),
} ) );

const mockUseStatsVideoPlays = useStatsVideoPlays as jest.MockedFunction<
	typeof useStatsVideoPlays
>;

const linkReport: StatsNormalizedReport< StatsVideoPlaysItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					id: 441,
					label: 'Demo',
					plays: 7,
					impressions: 0,
					watch_time: 0,
					retention_rate: 0,
					link: 'https://example.com/video/441',
					children: null,
				},
			],
		},
		{
			time_interval: '2026-07-10',
			date_start: '2026-07-10T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: [
				{
					id: 441,
					label: 'Demo',
					plays: 6,
					impressions: 0,
					watch_time: 0,
					retention_rate: 0,
					link: null,
					children: null,
				},
			],
		},
	],
};

const summaryRows: StatsVideoPlaysComparisonItem[] = [
	{
		id: 441,
		label: 'Demo',
		plays: 13,
		impressions: 22,
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
 * Configure the daily link-enrichment and complete-stats summary hook calls.
 *
 * @param options                  - Mocked request state and comparison rows.
 * @param options.rows             - Comparison-aware summary table rows.
 * @param options.hasComparison    - Whether at least one summary row matched.
 * @param options.summaryIsLoading - Whether the complete-stats request is loading.
 * @param options.summaryIsError   - Whether the complete-stats request failed.
 * @return Refetch mocks for both report sources.
 */
function mockQueries( {
	rows = summaryRows,
	hasComparison = false,
	summaryIsLoading = false,
	summaryIsError = false,
}: {
	rows?: StatsVideoPlaysComparisonItem[];
	hasComparison?: boolean;
	summaryIsLoading?: boolean;
	summaryIsError?: boolean;
} = {} ) {
	const linkRefetch = jest.fn();
	const summaryRefetch = jest.fn();

	mockUseStatsVideoPlays.mockImplementation( requestParams => {
		if ( requestParams.complete_stats ) {
			return {
				comparisonRows: { rows, hasComparison },
				hasComparison,
				isLoading: summaryIsLoading,
				isError: summaryIsError,
				refetch: summaryRefetch,
			} as unknown as ReturnType< typeof useStatsVideoPlays >;
		}

		return {
			primary: { data: linkReport },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
			isError: false,
			refetch: linkRefetch,
		} as unknown as ReturnType< typeof useStatsVideoPlays >;
	} );

	return { linkRefetch, summaryRefetch };
}

describe( 'useVideosReportRecords', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'uses comparison-aware complete-stats rows and daily data only for links', () => {
		mockQueries();

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenNthCalledWith( 1, {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( mockUseStatsVideoPlays ).toHaveBeenNthCalledWith( 2, {
			...params,
			max: 0,
			summarize: 1,
			complete_stats: 1,
		} );
		expect( result.current.rows.map( row => row.plays ) ).toEqual( [ 13, 3 ] );
		expect( result.current.hasComparison ).toBe( false );
	} );

	it( 'restores summary links from matching daily rows and leaves unmatched rows unlinked', () => {
		mockQueries();

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.rows ).toEqual( [
			expect.objectContaining( {
				id: 441,
				link: 'https://example.com/video/441',
			} ),
			expect.objectContaining( {
				id: 999,
				link: null,
			} ),
		] );
	} );

	it( 'preserves comparison metrics while keeping link enrichment primary-only', () => {
		mockQueries( {
			rows: [
				{
					...summaryRows[ 0 ],
					previousPlays: 8,
					previousImpressions: 11,
				},
				summaryRows[ 1 ],
			],
			hasComparison: true,
		} );
		const comparisonParams: ReportParams = {
			...params,
			comp: '1',
			compare_from: '2026-07-07',
			compare_to: '2026-07-08',
		};

		const { result } = renderHook( () => useVideosReportRecords( comparisonParams ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenNthCalledWith( 1, {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( mockUseStatsVideoPlays ).toHaveBeenNthCalledWith( 2, {
			...comparisonParams,
			max: 0,
			summarize: 1,
			complete_stats: 1,
		} );
		expect( result.current.rows[ 0 ] ).toEqual(
			expect.objectContaining( {
				link: 'https://example.com/video/441',
				plays: 13,
				previousPlays: 8,
				impressions: 22,
				previousImpressions: 11,
			} )
		);
		expect( result.current.rows[ 1 ].previousPlays ).toBeUndefined();
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'reports the table loading state from the summary query', () => {
		mockQueries( { summaryIsLoading: true } );

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'combines errors and refetches both table data sources', async () => {
		const { linkRefetch, summaryRefetch } = mockQueries( { summaryIsError: true } );

		const { result } = renderHook( () => useVideosReportRecords( params ) );

		expect( result.current.isError ).toBe( true );
		await result.current.refetch();
		expect( linkRefetch ).toHaveBeenCalledTimes( 1 );
		expect( summaryRefetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
