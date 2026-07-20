import { useStatsReferrers } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useReferrersReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsReferrersItem,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsReferrers: jest.fn(),
} ) );

const mockUseStatsReferrers = useStatsReferrers as jest.MockedFunction< typeof useStatsReferrers >;

const report: StatsNormalizedReport< StatsReferrersItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					label: 'example.com',
					views: 7,
					link: 'https://example.com/',
					icon: null,
					labelIcon: 'external',
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
					label: 'example.com',
					views: 6,
					link: 'https://example.com/',
					icon: null,
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

const comparisonReport: StatsNormalizedReport< StatsReferrersItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-07',
			date_start: '2026-07-07T00:00:00+00:00',
			date_end: '2026-07-07T23:59:59+00:00',
			items: [
				{
					label: 'wordpress.com',
					views: 4,
					link: 'https://wordpress.com/',
					icon: null,
					labelIcon: 'external',
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
					label: 'wordpress.org',
					views: 5,
					link: 'https://wordpress.org/',
					icon: null,
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

describe( 'useReferrersReportRecords', () => {
	beforeEach( () => {
		mockUseStatsReferrers.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsReferrers > );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'keeps the request day-bucketed while grouping only the chart by week', () => {
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};
		const { result: dayResult } = renderHook( () => useReferrersReportRecords( params, 'day' ) );
		const { result: weekResult } = renderHook( () => useReferrersReportRecords( params, 'week' ) );

		expect( mockUseStatsReferrers ).toHaveBeenLastCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( weekResult.current.chart.primary ).toEqual( {
			summary: {
				date_start: '2026-07-09T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
			},
			data: [
				expect.objectContaining( {
					time_interval: '2026-07-06',
					date_start: '2026-07-06T00:00:00+00:00',
					views: 13,
				} ),
			],
		} );
		expect( weekResult.current.rows ).toEqual( dayResult.current.rows );
	} );

	it( 'includes comparison chart buckets when referrers do not overlap the primary period', () => {
		mockUseStatsReferrers.mockReturnValue( {
			primary: { data: report },
			comparison: { data: comparisonReport },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsReferrers > );
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
			compare_from: '2026-07-07',
			compare_to: '2026-07-08',
		};

		const { result } = renderHook( () => useReferrersReportRecords( params, 'day' ) );

		expect( result.current.chart.comparison ).toBeDefined();
		expect( result.current.chart.comparison?.data.map( point => point.views ) ).toEqual( [ 4, 5 ] );
	} );

	it( 'omits the comparison chart when comparison params are absent', () => {
		mockUseStatsReferrers.mockReturnValue( {
			primary: { data: report },
			comparison: { data: comparisonReport },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsReferrers > );
		const params: ReportParams = {
			from: '2026-07-09',
			to: '2026-07-10',
			interval: 'day',
		};

		const { result } = renderHook( () => useReferrersReportRecords( params, 'day' ) );

		expect( result.current.chart.comparison ).toBeUndefined();
	} );
} );
