import { useStatsLocations } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useLocationsReportRecords } from './use-report-records';
import type {
	ReportParams,
	StatsLocationsItem,
	StatsNormalizedReport,
} from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsLocations: jest.fn(),
} ) );

const mockUseStatsLocations = useStatsLocations as jest.MockedFunction< typeof useStatsLocations >;

const report: StatsNormalizedReport< StatsLocationsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-07-09',
			date_start: '2026-07-09T00:00:00+00:00',
			date_end: '2026-07-09T23:59:59+00:00',
			items: [
				{
					label: 'India',
					views: 7,
					countryCode: 'IN',
					countryFull: 'India',
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
					label: 'India',
					views: 6,
					countryCode: 'IN',
					countryFull: 'India',
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

describe( 'useLocationsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsLocations.mockReset();
		mockUseStatsLocations.mockReturnValue( {
			primary: { data: report },
			comparison: { data: undefined },
			hasComparison: false,
			isLoading: false,
		} as ReturnType< typeof useStatsLocations > );
	} );

	it( 'keeps every location request day-bucketed', () => {
		renderHook( () => useLocationsReportRecords( 'countries', params, 'day' ) );

		expect( mockUseStatsLocations ).toHaveBeenCalledWith(
			{
				...params,
				max: 0,
				summarize: 0,
				period: 'day',
				geoMode: 'country',
			},
			{ enabled: true }
		);
	} );

	it( 'keeps the request day-bucketed while grouping only the chart by week', () => {
		const { result: dailyResult } = renderHook( () =>
			useLocationsReportRecords( 'countries', params, 'day' )
		);
		const { result: weeklyResult } = renderHook( () =>
			useLocationsReportRecords( 'countries', params, 'week' )
		);

		expect(
			mockUseStatsLocations.mock.calls.every(
				( [ requestParams ] ) => requestParams.period === 'day'
			)
		).toBe( true );
		expect( weeklyResult.current.chart.primary.data ).toEqual( [
			expect.objectContaining( { time_interval: '2026-07-06', views: 13 } ),
		] );
		expect( weeklyResult.current.table.rows ).toEqual( dailyResult.current.table.rows );
	} );
} );
