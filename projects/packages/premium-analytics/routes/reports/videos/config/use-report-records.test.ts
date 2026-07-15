import { useStatsVideoPlays, useStatsVideoPlaysSummary } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useVideosReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsVideoPlaysItem,
	StatsVideoPlaysSummary,
	StatsVideoPlaysSummaryItem,
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
					link: null,
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

const summaryRows: StatsVideoPlaysSummaryItem[] = [
	{
		id: 441,
		title: 'Demo',
		views: 13,
		impressions: 22,
		watch_time: 0.04,
		retention_rate: 64.5,
		link: null,
	},
];

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
		data: {
			data: summaryRows,
			total: { views: 13, impressions: 22, watch_time: 0.04 },
		} satisfies StatsVideoPlaysSummary,
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
		expect( result.current.rows ).toBe( summaryRows );
		expect( result.current.chart.primary.data.map( point => point.plays ) ).toEqual( [ 7, 6 ] );
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
		expect( result.current.rows ).toBe( summaryRows );
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
} );
