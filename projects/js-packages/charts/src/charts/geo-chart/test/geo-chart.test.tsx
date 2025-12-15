/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import GeoChart, { GeoChartUnresponsive } from '../geo-chart';

// Mock react-google-charts
jest.mock( 'react-google-charts', () => ( {
	Chart: jest.fn( ( { data, options, width, height } ) => {
		return (
			<div data-testid="google-chart-mock" data-width={ width } data-height={ height }>
				<div data-testid="chart-data">{ JSON.stringify( data ) }</div>
				<div data-testid="chart-options">{ JSON.stringify( options ) }</div>
			</div>
		);
	} ),
} ) );

describe( 'GeoChart', () => {
	const defaultProps = {
		width: 800,
		height: 400,
		data: {
			USA: 100,
			CAN: 50,
			GBR: 25,
		},
	};

	const renderWithTheme = ( props = {} ) => {
		return render(
			<GlobalChartsProvider>
				<GeoChartUnresponsive { ...defaultProps } { ...props } />
			</GlobalChartsProvider>
		);
	};

	describe( 'Basic Rendering', () => {
		test( 'renders a container with the geo-chart class', () => {
			renderWithTheme();

			const container = screen.getByTestId( 'geo-chart' );
			expect( container ).toBeInTheDocument();
			expect( container ).toHaveClass( 'geo-chart' );
		} );

		test( 'renders a container with a custom class', () => {
			renderWithTheme( { className: 'custom-class' } );

			const container = screen.getByTestId( 'geo-chart' );
			expect( container ).toHaveClass( 'custom-class' );
		} );

		test( 'renders without GlobalChartsProvider by creating its own', () => {
			render( <GeoChartUnresponsive { ...defaultProps } /> );

			const container = screen.getByTestId( 'geo-chart' );
			expect( container ).toBeInTheDocument();
		} );

		test( 'passes dimensions to Google Charts', () => {
			renderWithTheme( { width: 1200, height: 600 } );

			const chart = screen.getByTestId( 'google-chart-mock' );
			expect( chart ).toHaveAttribute( 'data-width', '1200' );
			expect( chart ).toHaveAttribute( 'data-height', '600' );
		} );
	} );

	describe( 'Data Handling', () => {
		test( 'transforms data to Google Charts format', () => {
			renderWithTheme( { data: { USA: 100, CAN: 50 } } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			// First row should be headers
			expect( data[ 0 ] ).toEqual( [ 'Country', 'Value' ] );
			// Data should include our countries
			expect( data ).toContainEqual( [ 'USA', 100 ] );
			expect( data ).toContainEqual( [ 'CAN', 50 ] );
		} );

		test( 'handles empty data object', () => {
			renderWithTheme( { data: {} } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			// Should only have headers
			expect( data ).toEqual( [ [ 'Country', 'Value' ] ] );
		} );

		test( 'handles single country data', () => {
			renderWithTheme( { data: { USA: 100 } } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			expect( data ).toHaveLength( 2 ); // headers + 1 country
			expect( data[ 1 ] ).toEqual( [ 'USA', 100 ] );
		} );

		test( 'handles zero values in data', () => {
			renderWithTheme( { data: { USA: 0, CAN: 100 } } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			expect( data ).toContainEqual( [ 'USA', 0 ] );
			expect( data ).toContainEqual( [ 'CAN', 100 ] );
		} );
	} );

	describe( 'Chart Options', () => {
		test( 'configures color axis with theme colors', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.colorAxis ).toBeDefined();
			expect( options.colorAxis.colors ).toHaveLength( 2 );
		} );

		test( 'sets datalessRegionColor from theme', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.datalessRegionColor ).toBeDefined();
		} );

		test( 'disables legend', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.legend ).toBe( 'none' );
		} );

		test( 'sets tooltip trigger to focus', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.tooltip ).toEqual( { trigger: 'focus' } );
		} );
	} );

	describe( 'Loading State', () => {
		test( 'provides loading placeholder to Google Charts', () => {
			// The loading placeholder is passed to the Chart component's loader prop
			// In real usage, Google Charts shows this while loading
			renderWithTheme();

			// Component should render without errors
			expect( screen.getByTestId( 'geo-chart' ) ).toBeInTheDocument();
		} );

		test( 'uses custom renderPlaceholder when provided', () => {
			const customPlaceholder = jest.fn( () => (
				<div data-testid="custom-placeholder">Custom loading...</div>
			) );
			renderWithTheme( { renderPlaceholder: customPlaceholder } );

			// The component should call the custom placeholder function
			expect( customPlaceholder ).toHaveBeenCalled();
		} );
	} );

	describe( 'Responsive Wrapper', () => {
		test( 'GeoChart export is the responsive version', () => {
			expect( GeoChart ).toBeDefined();
			expect( typeof GeoChart ).toBe( 'function' );
		} );

		test( 'GeoChartUnresponsive export is available for fixed dimensions', () => {
			expect( GeoChartUnresponsive ).toBeDefined();
			expect( GeoChartUnresponsive.displayName ).toBe( 'GeoChart' );
		} );
	} );
} );
