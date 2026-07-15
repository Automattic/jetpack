import { useStatsClicks } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useClicksReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsClicksItem,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsClicks: jest.fn(),
} ) );

const mockUseStatsClicks = useStatsClicks as jest.MockedFunction< typeof useStatsClicks >;

const report: StatsNormalizedReport< StatsClicksItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					label: 'jetpack.com',
					views: 7,
					link: 'https://jetpack.com/',
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
					label: 'jetpack.com',
					views: 6,
					link: 'https://jetpack.com/',
					icon: null,
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

/**
 * Configure the mocked Stats hook with the daily report fixture.
 */
function mockClicksReport() {
	mockUseStatsClicks.mockReturnValue( {
		primary: { data: report },
		comparison: { data: undefined },
		hasComparison: false,
		isLoading: false,
	} as ReturnType< typeof useStatsClicks > );
}

describe( 'useClicksReportRecords', () => {
	beforeEach( () => {
		mockUseStatsClicks.mockReset();
		mockClicksReport();
	} );

	it( 'derives table and daily chart data from a day-bucketed request', () => {
		const { result } = renderHook( () => useClicksReportRecords( params, 'day' ) );

		expect( mockUseStatsClicks ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( result.current.chart.primary.data.map( point => point.clicks ) ).toEqual( [ 7, 6 ] );
		expect( result.current.rows ).toEqual( [
			expect.objectContaining( { clickedUrl: 'https://jetpack.com/', clicks: 13 } ),
		] );
	} );

	it( 'keeps the request day-bucketed while grouping only the chart by week', () => {
		const { result: dayResult, unmount } = renderHook( () =>
			useClicksReportRecords( params, 'day' )
		);
		const dayRows = dayResult.current.rows;
		unmount();
		mockUseStatsClicks.mockClear();

		const { result } = renderHook( () => useClicksReportRecords( params, 'week' ) );

		expect( mockUseStatsClicks ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
		} );
		expect( result.current.chart.primary.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-07-06',
				clicks: 13,
				value: 13,
			} ),
		] );
		expect( result.current.rows ).toEqual( dayRows );
	} );
} );
