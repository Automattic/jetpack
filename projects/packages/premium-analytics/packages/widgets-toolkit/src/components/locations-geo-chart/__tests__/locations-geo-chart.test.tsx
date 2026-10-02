/**
 * External dependencies
 */
import { useViewerCountry } from '@jetpack-premium-analytics/data';
import { GeoChart } from '@jetpack-premium-analytics/externals';
import { act, render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { LocationsGeoChart } from '../locations-geo-chart';
import type { LocationsGeoRow } from '../build-geo-data';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	useViewerCountry: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	GeoChart: jest.fn( () => <div data-testid="geo-chart" /> ),
} ) );

const geoChartMock = jest.mocked( GeoChart );
const useViewerCountryMock = jest.mocked( useViewerCountry );

const ROWS: LocationsGeoRow[] = [
	{ label: 'Taipei City', value: 40, countryCode: 'TW', countryFull: 'Taiwan' },
];

const removeErrorMock = jest.fn();

function lastChartProps() {
	return geoChartMock.mock.calls[ geoChartMock.mock.calls.length - 1 ][ 0 ];
}

describe( 'LocationsGeoChart', () => {
	beforeEach( () => {
		geoChartMock.mockClear();
		useViewerCountryMock.mockReturnValue( {
			data: null,
			isPending: false,
		} as ReturnType< typeof useViewerCountry > );
		removeErrorMock.mockClear();
		( window as Window & { google?: unknown } ).google = {
			visualization: { errors: { removeError: removeErrorMock } },
		};
	} );

	afterEach( () => {
		delete ( window as Window & { google?: unknown } ).google;
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
		expect( removeErrorMock ).toHaveBeenCalledWith( 'error-1' );

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

	it( "draws disputed borders from the viewer's country", () => {
		useViewerCountryMock.mockReturnValue( {
			data: 'IN',
			isPending: false,
		} as ReturnType< typeof useViewerCountry > );

		render( <LocationsGeoChart rows={ ROWS } mode="country" /> );

		expect( lastChartProps() ).toMatchObject( { domain: 'IN' } );
	} );

	// Drawing first would paint the default borders and then swap them.
	it( "holds the map back until the viewer's country is known", () => {
		useViewerCountryMock.mockReturnValue( {
			data: undefined,
			isPending: true,
		} as ReturnType< typeof useViewerCountry > );

		render( <LocationsGeoChart rows={ ROWS } mode="country" /> );

		expect( geoChartMock ).not.toHaveBeenCalled();
	} );

	it( 'draws the default borders when the country lookup settles without a country', () => {
		render( <LocationsGeoChart rows={ ROWS } mode="country" /> );

		expect( lastChartProps().domain ).toBeUndefined();
	} );

	it( 'keeps the error on screen where no fallback map follows', () => {
		render(
			<LocationsGeoChart
				rows={ ROWS }
				mode="city"
				focusCountry={ { code: 'TW', name: 'Taiwan' } }
			/>
		);

		expect( lastChartProps() ).toMatchObject( { region: 'TW', resolution: 'countries' } );

		act( () => {
			lastChartProps().onError?.( { id: 'error-2', message: 'Requested map does not exist' } );
		} );

		expect( removeErrorMock ).not.toHaveBeenCalled();
		expect( lastChartProps() ).toMatchObject( { region: 'TW', resolution: 'countries' } );
	} );
} );
