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
		data: [
			[ 'Country', 'Value' ],
			[ 'US', 100 ],
			[ 'CA', 50 ],
			[ 'GB', 25 ],
		] as [ string[], ...[ string, number ][] ],
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
		test( 'passes data directly to Google Charts', () => {
			const testData: [ string[], ...[ string, number ][] ] = [
				[ 'Country', 'Value' ],
				[ 'US', 100 ],
				[ 'CA', 50 ],
			];
			renderWithTheme( { data: testData } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			// First row should be headers
			expect( data[ 0 ] ).toEqual( [ 'Country', 'Value' ] );
			// Data should include our countries
			expect( data ).toContainEqual( [ 'US', 100 ] );
			expect( data ).toContainEqual( [ 'CA', 50 ] );
		} );

		test( 'handles header-only data', () => {
			const testData: [ string[], ...[ string, number ][] ] = [ [ 'Country', 'Value' ] ];
			renderWithTheme( { data: testData } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			// Should only have headers
			expect( data ).toEqual( [ [ 'Country', 'Value' ] ] );
		} );

		test( 'handles single country data', () => {
			const testData: [ string[], ...[ string, number ][] ] = [
				[ 'Country', 'Value' ],
				[ 'US', 100 ],
			];
			renderWithTheme( { data: testData } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			expect( data ).toHaveLength( 2 ); // headers + 1 country
			expect( data[ 1 ] ).toEqual( [ 'US', 100 ] );
		} );

		test( 'handles zero values in data', () => {
			const testData: [ string[], ...[ string, number ][] ] = [
				[ 'Country', 'Value' ],
				[ 'US', 0 ],
				[ 'CA', 100 ],
			];
			renderWithTheme( { data: testData } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			expect( data ).toContainEqual( [ 'US', 0 ] );
			expect( data ).toContainEqual( [ 'CA', 100 ] );
		} );

		test( 'supports custom tooltip columns', () => {
			const testData: [ ( string | object )[], ...[ string, number, string ][] ] = [
				[ 'Country', 'Value', { type: 'string', role: 'tooltip', p: { html: true } } ],
				[ 'US', 100, '<b>United States</b><br/>100 orders' ],
				[ 'CA', 50, '<b>Canada</b><br/>50 orders' ],
			];
			renderWithTheme( { data: testData } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			// Should include tooltip column in header
			expect( data[ 0 ][ 2 ] ).toEqual( {
				type: 'string',
				role: 'tooltip',
				p: { html: true },
			} );
			// Data rows should include tooltip content
			expect( data[ 1 ][ 2 ] ).toBe( '<b>United States</b><br/>100 orders' );
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

		test( 'sets tooltip trigger to focus with isHtml false by default', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.tooltip ).toEqual( { trigger: 'focus', isHtml: false } );
		} );

		test( 'enables HTML tooltips when data has HTML tooltip column', () => {
			const testData: [ ( string | object )[], ...[ string, number, string ][] ] = [
				[ 'Country', 'Value', { type: 'string', role: 'tooltip', p: { html: true } } ],
				[ 'US', 100, '<b>United States</b><br/>100 orders' ],
				[ 'CA', 50, '<b>Canada</b><br/>50 orders' ],
			];
			renderWithTheme( { data: testData } );

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.tooltip ).toEqual( { trigger: 'focus', isHtml: true } );
		} );

		test( 'keeps isHtml false for text-only tooltips', () => {
			const testData: [ ( string | object )[], ...[ string, number, string ][] ] = [
				[ 'Country', 'Value', { type: 'string', role: 'tooltip' } ],
				[ 'US', 100, 'United States: 100 orders' ],
				[ 'CA', 50, 'Canada: 50 orders' ],
			];
			renderWithTheme( { data: testData } );

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.tooltip ).toEqual( { trigger: 'focus', isHtml: false } );
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
