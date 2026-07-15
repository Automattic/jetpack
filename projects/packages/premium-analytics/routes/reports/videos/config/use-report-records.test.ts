import { useStatsVideoPlays } from '@jetpack-premium-analytics/data';
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
} ) );

const mockUseStatsVideoPlays = useStatsVideoPlays as jest.MockedFunction<
	typeof useStatsVideoPlays
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
					impressions: 10,
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
					impressions: 12,
					watch_time: 0,
					retention_rate: 0,
					link: null,
					children: null,
				},
			],
		},
	],
};

describe( 'useVideosReportRecords', () => {
	it( 'derives table and chart data from the shared bucketed video hook', () => {
		mockUseStatsVideoPlays.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsVideoPlays > );
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};

		const { result } = renderHook( () => useVideosReportRecords( params, 'day' ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
			complete_stats: 1,
		} );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { id: 441, plays: 13, impressions: 22 } ),
		] );
		expect( result.current.chart.primary.data.map( point => point.plays ) ).toEqual( [ 7, 6 ] );
	} );

	it( 'keeps the request day-bucketed while grouping the chart by week', () => {
		mockUseStatsVideoPlays.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsVideoPlays > );
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};

		const { result } = renderHook( () => useVideosReportRecords( params, 'week' ) );

		expect( mockUseStatsVideoPlays ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
			complete_stats: 1,
		} );
		expect( result.current.chart.primary.data ).toEqual( [
			expect.objectContaining( { time_interval: '2026-07-06', plays: 13 } ),
		] );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { id: 441, plays: 13, impressions: 22 } ),
		] );
	} );
} );
