import { useStatsFileDownloads } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useDownloadsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsFileDownloadsItem,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsFileDownloads: jest.fn(),
} ) );

const mockUseStatsFileDownloads = useStatsFileDownloads as jest.MockedFunction<
	typeof useStatsFileDownloads
>;

const report: StatsNormalizedReport< StatsFileDownloadsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					label: '/files/report.pdf',
					shortLabel: 'report.pdf',
					link: 'https://example.com/files/report.pdf',
					downloads: 7,
					linkTitle: '/files/report.pdf',
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
					label: '/files/report.pdf',
					shortLabel: 'report.pdf',
					link: 'https://example.com/files/report.pdf',
					downloads: 6,
					linkTitle: '/files/report.pdf',
					labelIcon: 'external',
					children: null,
				},
			],
		},
	],
};

const params: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

describe( 'useDownloadsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsFileDownloads.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsFileDownloads > );
	} );

	it( 'derives table and chart data from a day-bucketed request', () => {
		const { result } = renderHook( () => useDownloadsReportRecords( params, 'day' ) );

		expect( mockUseStatsFileDownloads ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( result.current.chart.primary.data.map( point => point.downloads ) ).toEqual( [ 7, 6 ] );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { shortLabel: 'report.pdf', downloads: 13 } ),
		] );
	} );

	it( 'keeps the request day-bucketed while grouping the chart by week', () => {
		const dayResult = renderHook( () => useDownloadsReportRecords( params, 'day' ) ).result;
		const weekResult = renderHook( () => useDownloadsReportRecords( params, 'week' ) ).result;

		expect( mockUseStatsFileDownloads ).toHaveBeenLastCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( weekResult.current.chart.primary.summary ).toEqual( {
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-10T23:59:59+00:00',
		} );
		expect( weekResult.current.chart.primary.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				date_start: '2026-07-06T00:00:00+00:00',
				date_end: '2026-07-10T23:59:59+00:00',
				downloads: 13,
			} ),
		] );
		expect( weekResult.current.rows ).toEqual( dayResult.current.rows );
	} );
} );
