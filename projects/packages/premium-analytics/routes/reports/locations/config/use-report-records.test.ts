import { useStatsLocations } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { useLocationsReportRecords } from './use-report-records';
import type { ReportParams, StatsLocationsComparisonItem } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsLocations: jest.fn(),
} ) );

const mockUseStatsLocations = useStatsLocations as jest.MockedFunction< typeof useStatsLocations >;

const rows: StatsLocationsComparisonItem[] = [
	{
		label: 'India',
		views: 13,
		countryCode: 'IN',
		countryFull: 'India',
		children: null,
		previousViews: 9,
	},
];

const params: ReportParams = {
	from: '2026-07-09',
	to: '2026-07-10',
	interval: 'day',
};

const REQUEST_PARAMS = {
	...params,
	max: 0,
	summarize: 1,
	period: 'day',
};

/**
 * Build a settled report result for the mocked hook.
 *
 * @param overrides - Fields to override for the case under test.
 * @return The mocked report result.
 */
function reportResult( overrides: Record< string, unknown > = {} ) {
	return {
		isLoading: false,
		isFetching: false,
		isError: false,
		primary: { isLoading: false, isFetching: false, isError: false },
		comparison: { isLoading: false, isFetching: false, isError: false },
		comparisonRows: { rows, hasComparison: true },
		hasComparison: true,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsLocations >;
}

describe( 'useLocationsReportRecords', () => {
	beforeEach( () => {
		mockUseStatsLocations.mockReset();
		mockUseStatsLocations.mockReturnValue( reportResult() );
	} );

	it( 'summarizes every location request', () => {
		renderHook( () => useLocationsReportRecords( 'cities', params ) );

		expect(
			mockUseStatsLocations.mock.calls.every(
				( [ requestParams ] ) => requestParams.summarize === 1 && requestParams.period === 'day'
			)
		).toBe( true );
	} );

	it( 'requests countries unfiltered on every tab, so the filter keeps its options', () => {
		renderHook( () => useLocationsReportRecords( 'regions', params, 'IN' ) );

		// No `enabled` gate and no `filter_by_country`: this call backs the
		// country filter's options as well as the Countries tab.
		expect( mockUseStatsLocations ).toHaveBeenCalledWith( {
			...REQUEST_PARAMS,
			geoMode: 'country',
		} );
	} );

	it( 'scopes the active tab to the selected country', () => {
		renderHook( () => useLocationsReportRecords( 'regions', params, 'IN' ) );

		expect( mockUseStatsLocations ).toHaveBeenCalledWith(
			{
				...REQUEST_PARAMS,
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

	it( 'carries the previous period through to the table rows', () => {
		const { result } = renderHook( () => useLocationsReportRecords( 'countries', params ) );

		expect( result.current.table.rows ).toEqual( [
			{
				id: 'IN:India',
				label: 'India',
				countryCode: 'IN',
				countryFull: 'India',
				views: 13,
				previousViews: 9,
			},
		] );
		expect( result.current.hasComparison ).toBe( true );
	} );

	it( 'reports the active tab fetch state, not the country options query', () => {
		mockUseStatsLocations.mockImplementation( ( requestParams, options ) =>
			reportResult( {
				// Only the enabled per-tab query refetches; the always-on
				// countries query is already settled.
				isFetching: options?.enabled === true,
			} )
		);

		const { result } = renderHook( () => useLocationsReportRecords( 'cities', params ) );

		expect( result.current.table.isFetching ).toBe( true );
	} );

	it( 'reports the active tab error and retry, not the country options query', () => {
		mockUseStatsLocations.mockImplementation( ( requestParams, options ) =>
			reportResult( {
				// Only the enabled per-tab query fails; the always-on countries
				// query stays healthy, so the page must not read its state.
				primary: { isLoading: false, isFetching: false, isError: options?.enabled === true },
			} )
		);

		const { result } = renderHook( () => useLocationsReportRecords( 'regions', params ) );

		expect( result.current.isError ).toBe( true );
	} );

	it( 'keeps the primary rows when only the comparison period fails', () => {
		mockUseStatsLocations.mockReturnValue(
			reportResult( {
				comparison: { isLoading: false, isFetching: false, isError: true },
			} )
		);

		const { result } = renderHook( () => useLocationsReportRecords( 'countries', params ) );

		expect( result.current.isError ).toBe( false );
		expect( result.current.table.rows ).toHaveLength( 1 );
	} );
} );
