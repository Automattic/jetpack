/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { Locations } from '../locations';
import type { LocationsGeoChartProps } from '../../locations-geo-chart';
import type { LocationRowInput } from '../build-locations-data';
import type { ReactNode } from 'react';

// The map is Google's; the kind's job is what it hands it.
jest.mock( '../../locations-geo-chart', () => ( {
	LocationsGeoChart: ( { mode, rows, valueLabel, chartTitle }: LocationsGeoChartProps ) => (
		<div
			data-testid="geo-chart"
			data-mode={ mode }
			data-rows={ rows.length }
			data-value-label={ valueLabel }
			data-chart-title={ chartTitle }
		/>
	),
} ) );

const ROWS: LocationRowInput[] = [
	{ id: 'us', label: 'United States', value: 1200, previousValue: 1000 },
	{ id: 'ca', label: 'Canada', value: 300, previousValue: 400 },
];

const READY = { isLoading: false, isError: false };

const Providers = ( { children }: { children: ReactNode } ) => (
	<GlobalChartsProvider>{ children }</GlobalChartsProvider>
);

const renderLocations = ( ui: ReactNode ) => render( ui, { wrapper: Providers } );

describe( 'Locations', () => {
	it( 'lists the rows and hands the map the same places, as countries or as regions', () => {
		const { rerender } = renderLocations(
			<Locations rows={ ROWS } status={ READY } valueLabel="Views" />
		);

		expect( screen.getByText( 'United States' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Canada' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'geo-chart' ) ).toHaveAttribute( 'data-mode', 'country' );
		expect( screen.getByTestId( 'geo-chart' ) ).toHaveAttribute( 'data-rows', '2' );
		expect( screen.getByTestId( 'geo-chart' ) ).toHaveAttribute( 'data-value-label', 'Views' );

		rerender(
			<Locations
				rows={ [ { id: 'California', label: 'California', value: 500 } ] }
				status={ READY }
				country={ { code: 'US', name: 'United States' } }
				valueLabel="Views"
			/>
		);

		expect( screen.getByTestId( 'geo-chart' ) ).toHaveAttribute( 'data-mode', 'region' );
	} );

	it( 'names the list and hands the map the chart title', () => {
		renderLocations(
			<Locations rows={ ROWS } status={ READY } valueLabel="Views" chartTitle="Locations" />
		);

		expect( screen.getByRole( 'list', { name: 'Chart: Locations' } ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'geo-chart' ) ).toHaveAttribute( 'data-chart-title', 'Locations' );
	} );

	it( 'shows the deltas only while the comparison period is on', () => {
		const { rerender } = renderLocations(
			<Locations rows={ ROWS } status={ READY } valueLabel="Views" />
		);

		expect( screen.queryByText( /20%/ ) ).not.toBeInTheDocument();

		rerender(
			<Locations rows={ ROWS } status={ { ...READY, hasComparison: true } } valueLabel="Views" />
		);

		expect( screen.getByText( /20%/ ) ).toBeInTheDocument();
	} );

	it( 'renders the empty state without rows', () => {
		renderLocations(
			<Locations
				rows={ [] }
				status={ READY }
				valueLabel="Views"
				empty={ { description: 'No location data in this period.' } }
			/>
		);

		expect( screen.getByText( 'No location data in this period.' ) ).toBeInTheDocument();
	} );

	it( 'offers a Retry bound to refetch when the widget passes no error of its own', async () => {
		const refetch = jest.fn();
		renderLocations(
			<Locations
				rows={ [] }
				status={ { isLoading: false, isError: true, refetch } }
				valueLabel="Views"
			/>
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( "We couldn't load this data." );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
