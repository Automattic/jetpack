/**
 * External dependencies
 */
import { GeoChart } from '@jetpack-premium-analytics/externals';
import { act, render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { LocationsGeoChart } from '../locations-geo-chart';
import type { LocationsGeoRow } from '../build-geo-data';

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	GeoChart: jest.fn( () => <div data-testid="geo-chart" /> ),
} ) );

const geoChartMock = jest.mocked( GeoChart );

const ROWS: LocationsGeoRow[] = [
	{ label: 'Taipei City', value: 40, countryCode: 'TW', countryFull: 'Taiwan' },
];

function lastChartProps() {
	return geoChartMock.mock.calls[ geoChartMock.mock.calls.length - 1 ][ 0 ];
}

describe( 'LocationsGeoChart', () => {
	beforeEach( () => {
		geoChartMock.mockClear();
	} );

	// The failed draw is cached in the module, so a later mount skips straight to
	// the map that works instead of flashing the error again.
	it( 'leaves the country for the world map once its provinces map fails to draw', () => {
		const { unmount } = render(
			<LocationsGeoChart
				rows={ ROWS }
				mode="region"
				focusCountry={ { code: 'TW', name: 'Taiwan' } }
			/>
		);

		expect( lastChartProps() ).toMatchObject( { region: 'TW', resolution: 'provinces' } );

		act( () => {
			lastChartProps().onError?.( { id: 'error-1', message: 'Requested map does not exist' } );
		} );

		expect( lastChartProps() ).toMatchObject( { region: 'world', resolution: 'countries' } );

		unmount();
		render(
			<LocationsGeoChart
				rows={ ROWS }
				mode="region"
				focusCountry={ { code: 'TW', name: 'Taiwan' } }
			/>
		);

		expect( lastChartProps() ).toMatchObject( { region: 'world', resolution: 'countries' } );
	} );
} );
