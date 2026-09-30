/**
 * External dependencies
 */
import { useStatsLocations } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import useLocationViews from '../use-location-views';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsLocations: jest.fn(),
} ) );

const mockUseStatsLocations = useStatsLocations as jest.MockedFunction< typeof useStatsLocations >;

const reportParams: ReportParams = { from: '2026-07-09', to: '2026-07-10', interval: 'day' };

describe( 'useLocationViews', () => {
	beforeEach( () => {
		mockUseStatsLocations.mockReset();
		mockUseStatsLocations.mockReturnValue( {
			comparisonRows: { rows: [], hasComparison: false },
			hasComparison: false,
			isLoading: false,
			isFetching: false,
			hasData: true,
			isError: false,
			refetch: jest.fn(),
		} as unknown as ReturnType< typeof useStatsLocations > );
	} );

	it( 'sends the region filter alongside its country', () => {
		renderHook( () =>
			useLocationViews( {
				reportParams,
				max: 10,
				geoMode: 'city',
				filter: { country: 'US', region: 'Minnesota' },
			} )
		);

		expect( mockUseStatsLocations.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			geoMode: 'city',
			filter_by_country: 'US',
			filter_by_region: 'Minnesota',
		} );
	} );
} );
