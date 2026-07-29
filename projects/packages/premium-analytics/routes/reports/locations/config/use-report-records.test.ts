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
		renderHook( () => useLocationsReportRecords( 'cities', params ) );

		expect(
			mockUseStatsLocations.mock.calls.every(
				( [ requestParams ] ) => requestParams.period === 'day'
			)
		).toBe( true );
	} );

	it( 'requests countries unfiltered on every tab, so the filter keeps its options', () => {
		renderHook( () => useLocationsReportRecords( 'regions', params, 'IN' ) );

		// No `enabled` gate and no `filter_by_country`: this call backs the
		// country filter's options as well as the Countries tab.
		expect( mockUseStatsLocations ).toHaveBeenCalledWith( {
			...params,
			max: 0,
			summarize: 0,
			period: 'day',
			geoMode: 'country',
		} );
	} );

	it( 'scopes the active tab to the selected country', () => {
		renderHook( () => useLocationsReportRecords( 'regions', params, 'IN' ) );

		expect( mockUseStatsLocations ).toHaveBeenCalledWith(
			{
				...params,
				max: 0,
				summarize: 0,
				period: 'day',
				geoMode: 'region',
				filter_by_country: 'IN',
			},
			{ enabled: true }
		);
	} );

	it( 'omits the country scope when no country is selected', () => {
		renderHook( () => useLocationsReportRecords( 'regions', params ) );

		const regionCall = mockUseStatsLocations.mock.calls.find(
			( [ requestParams ] ) => requestParams.geoMode === 'region'
		);

		expect( regionCall?.[ 0 ] ).not.toHaveProperty( 'filter_by_country' );
	} );

	it( 'orders country filter options by views, descending', () => {
		const { result } = renderHook( () => useLocationsReportRecords( 'regions', params ) );

		expect( result.current.countries.options ).toEqual( [ { code: 'IN', label: 'India' } ] );
	} );

	it( 'sums each location across the range for the table', () => {
		const { result } = renderHook( () => useLocationsReportRecords( 'countries', params ) );

		expect( result.current.table.rows ).toEqual( [
			{ id: 'IN:India', label: 'India', countryCode: 'IN', countryFull: 'India', views: 13 },
		] );
	} );

	it( 'reports the active tab error and retry, not the country options query', () => {
		mockUseStatsLocations.mockImplementation(
			( requestParams, options ) =>
				( {
					primary: { data: report },
					comparison: { data: undefined },
					hasComparison: false,
					isLoading: false,
					// Only the enabled per-tab query fails; the always-on countries
					// query stays healthy, so the page must not read its state.
					isError: options?.enabled === true,
				} ) as ReturnType< typeof useStatsLocations >
		);

		const { result } = renderHook( () => useLocationsReportRecords( 'regions', params ) );

		expect( result.current.isError ).toBe( true );
	} );
} );
