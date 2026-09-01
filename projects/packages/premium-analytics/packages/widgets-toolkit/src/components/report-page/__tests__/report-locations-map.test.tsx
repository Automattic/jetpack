/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { ReportLocationsMap } from '../report-locations-map';
import type { LocationsGeoRow } from '../../locations-geo-chart';

jest.mock( '../../locations-geo-chart', () => ( {
	LocationsGeoChart: () => <div data-testid="geo-chart" />,
} ) );

jest.mock( '../../widget-loading-overlay', () => ( {
	WidgetLoadingOverlay: () => <div data-testid="loading-overlay" />,
} ) );

const ROWS: LocationsGeoRow[] = [
	{ label: 'Germany', value: 400, countryCode: 'DE', countryFull: 'Germany' },
];

describe( 'ReportLocationsMap', () => {
	it( 'shows only the loading overlay while the first rows are on their way', () => {
		render( <ReportLocationsMap rows={ [] } mode="country" isLoading /> );

		expect( screen.getByTestId( 'loading-overlay' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'geo-chart' ) ).not.toBeInTheDocument();
	} );

	// A refetch keeps the previous period's map on screen, so the range change
	// does not blank the report while the new rows land.
	it( 'keeps the map under the overlay while refetching', () => {
		render( <ReportLocationsMap rows={ ROWS } mode="country" isLoading /> );

		expect( screen.getByTestId( 'geo-chart' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'loading-overlay' ) ).toBeInTheDocument();
	} );

	it( 'collapses the map from the footer control', async () => {
		render( <ReportLocationsMap rows={ ROWS } mode="country" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide map' } ) );

		expect( screen.queryByTestId( 'geo-chart' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Show map' } ) ).toBeInTheDocument();
	} );
} );
