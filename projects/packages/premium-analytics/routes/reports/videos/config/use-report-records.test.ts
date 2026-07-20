import { useStatsVideoPlays, useStatsVideoPlaysSummary } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useVideosReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsVideoPlaysItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsVideoPlays: jest.fn(),
	useStatsVideoPlaysSummary: jest.fn(),
} ) );

const mockUseStatsVideoPlays = useStatsVideoPlays as jest.MockedFunction<
	typeof useStatsVideoPlays
>;
const mockUseStatsVideoPlaysSummary = useStatsVideoPlaysSummary as jest.MockedFunction<
	typeof useStatsVideoPlaysSummary
>;

const report: StatsNormalizedReport< StatsVideoPlaysItem > = {
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

const comparisonReport: StatsNormalizedReport< StatsVideoPlaysItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-07',
			date_start: '2026-07-07T00:00:00+00:00',
			date_end: '2026-07-07T23:59:59+00:00',
			items: [
				{
					id: 777,
					label: 'Comparison video',
					plays: 4,
					impressions: 0,
					watch_time: 0,
					retention_rate: 0,
					link: null,
					children: null,
				},
			],
		},
		{
			time_interval: '2026-07-08',
			date_start: '2026-07-08T00:00:00+00:00',
			date_end: '2026-07-08T23:59:59+00:00',
			items: [
				{
					id: 777,
					label: 'Comparison video',
					plays: 5,
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

const summaryRows: StatsVideoPlaysItem[] = [
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

const summaryReport: StatsNormalizedReport< StatsVideoPlaysItem > = {
	summary: {
		total: { views: 16, impressions: 27, watch_time: 0.05 },
	},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
			items: summaryRows,
		},
	],
};

const params: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

/**
 * Configure the chart and summary hooks for a report-hook test.
 *
 * @param chartIsLoading   - Whether the daily plays query is loading.
 * @param summaryIsLoading - Whether the complete-stats summary query is loading.
 */
function mockQueries( chartIsLoading = false, summaryIsLoading = false ) {
	mockUseStatsVideoPlays.mockReturnValue( {
		primary: { data: report },
		comparison: { data: undefined },
		hasComparison: false,
		isLoading: chartIsLoading,
	} as ReturnType< typeof useStatsVideoPlays > );
	mockUseStatsVideoPlaysSummary.mockReturnValue( {
		data: summaryReport,
		isLoading: summaryIsLoading,
	} as ReturnType< typeof useStatsVideoPlaysSummary > );
}

describe( 'useVideosReportRecords', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'uses daily plays for the chart and complete-stats summary rows for the table', () => {
		mockQueries();

		const { result } = renderHook( () => useVideosReportRecords( params, 'day' ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( mockUseStatsVideoPlaysSummary ).toHaveBeenCalledWith( params );
		expect( result.current.rows.map( row => row.plays ) ).toEqual( [ 13, 3 ] );
		expect( result.current.chart.primary.data.map( point => point.plays ) ).toEqual( [ 7, 6 ] );
	} );

	it( 'restores summary links from matching daily rows and leaves unmatched rows unlinked', () => {
		mockQueries();

		const { result } = renderHook( () => useVideosReportRecords( params, 'day' ) );

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

	it( 'keeps the request day-bucketed while grouping only the chart by week', () => {
		mockQueries();

		const { result } = renderHook( () => useVideosReportRecords( params, 'week' ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( result.current.chart.primary.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				date_start: '2026-07-06T00:00:00+00:00',
				plays: 13,
			} ),
		] );
		expect( result.current.rows.map( row => row.id ) ).toEqual( [ 441, 999 ] );
	} );

	it( 'reports chart and table loading states from their respective queries', () => {
		mockQueries( true, false );

		const { result, rerender } = renderHook( () => useVideosReportRecords( params, 'day' ) );

		expect( result.current.chart.isLoading ).toBe( true );
		expect( result.current.isLoading ).toBe( false );

		mockQueries( false, true );
		rerender();

		expect( result.current.chart.isLoading ).toBe( false );
		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'includes comparison chart buckets when videos do not overlap the primary period', () => {
		mockQueries();
		mockUseStatsVideoPlays.mockReturnValue( {
			primary: { data: report },
			comparison: { data: comparisonReport },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsVideoPlays > );
		const comparisonParams: ReportParams = {
			...params,
			compare_from: '2026-07-07',
			compare_to: '2026-07-08',
		};

		const { result } = renderHook( () => useVideosReportRecords( comparisonParams, 'day' ) );

		expect( result.current.chart.comparison ).toBeDefined();
		expect( result.current.chart.comparison?.data.map( point => point.plays ) ).toEqual( [ 4, 5 ] );
	} );

	it( 'omits the comparison chart when comparison params are absent', () => {
		mockQueries();
		mockUseStatsVideoPlays.mockReturnValue( {
			primary: { data: report },
			comparison: { data: comparisonReport },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsVideoPlays > );

		const { result } = renderHook( () => useVideosReportRecords( params, 'day' ) );

		expect( result.current.chart.comparison ).toBeUndefined();
	} );
} );
