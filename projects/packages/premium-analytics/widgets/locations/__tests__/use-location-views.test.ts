/**
 * External dependencies
 */
import { useStatsLocations } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useLocationViews from '../use-location-views';
import type { ReportParams, StatsLocationsComparisonItem } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsLocations: jest.fn(),
} ) );

const mockUseStatsLocations = useStatsLocations as jest.MockedFunction< typeof useStatsLocations >;

const reportParams: ReportParams = { from: '2026-07-09', to: '2026-07-10', interval: 'day' };

/**
 * Build a US city row.
 *
 * @param label      - City name.
 * @param cityRegion - The region the endpoint reported, if any.
 * @return The row.
 */
function city( label: string, cityRegion?: string ): StatsLocationsComparisonItem {
	return {
		label,
		cityRegion,
		views: 1,
		countryCode: 'US',
		countryFull: 'United States',
		children: null,
	};
}

/**
 * Settle the mocked hook with the given rows.
 *
 * @param rows - Rows the endpoint returned.
 */
function mockRows( rows: StatsLocationsComparisonItem[] ) {
	mockUseStatsLocations.mockReturnValue( {
		comparisonRows: { rows, hasComparison: false },
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: true,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ReturnType< typeof useStatsLocations > );
}

describe( 'useLocationViews', () => {
	beforeEach( () => {
		mockUseStatsLocations.mockReset();
		mockRows( [] );
	} );

	it( 'sends the region filter alongside its country', () => {
		renderHook( () =>
			useLocationViews( {
				reportParams,
				max: 10,
				geoMode: 'city',
				countryFilter: 'US',
				regionFilter: 'Minnesota',
			} )
		);

		expect( mockUseStatsLocations.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			geoMode: 'city',
			filter_by_country: 'US',
			filter_by_region: 'Minnesota',
		} );
	} );

	it( 'never sends a region filter without a country, which the endpoint rejects', () => {
		renderHook( () =>
			useLocationViews( { reportParams, max: 10, geoMode: 'city', regionFilter: 'Minnesota' } )
		);

		expect( mockUseStatsLocations.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty( 'filter_by_region' );
	} );

	it( 'drops cities outside the region, so an endpoint that ignored the filter shows nothing', () => {
		mockRows( [
			city( 'Minneapolis', 'Minnesota' ),
			city( 'New York' ),
			city( 'Miami', 'Florida' ),
		] );

		const { result } = renderHook( () =>
			useLocationViews( {
				reportParams,
				max: 10,
				geoMode: 'city',
				countryFilter: 'US',
				regionFilter: 'Minnesota',
			} )
		);

		expect( result.current.data.map( row => row.label ) ).toEqual( [ 'Minneapolis' ] );
	} );

	it( 'keeps every city when no region is picked', () => {
		mockRows( [ city( 'Minneapolis' ), city( 'New York' ) ] );

		const { result } = renderHook( () =>
			useLocationViews( { reportParams, max: 10, geoMode: 'city' } )
		);

		expect( result.current.data ).toHaveLength( 2 );
	} );
} );
