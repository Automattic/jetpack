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
		test( 'passes data directly to Google Charts without modification', () => {
			// Test with complex data including plain values, formatted values, and tooltip columns
			const testData: [
				( string | object )[],
				...[ string, number | { v: number; f: string }, string ][],
			] = [
				[ 'Country', 'Revenue', { type: 'string', role: 'tooltip', p: { html: true } } ],
				[ 'US', { v: 1234567, f: '$1.23M' }, '<b>United States</b>' ],
				[ 'CA', 543210, '<b>Canada</b>' ],
			];
			renderWithTheme( { data: testData } );

			const chartData = screen.getByTestId( 'chart-data' );
			const data = JSON.parse( chartData.textContent || '[]' );

			// Data should be passed through exactly as provided
			expect( data ).toEqual( testData );
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

		test( 'does not include region in options when set to world (default)', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.region ).toBeUndefined();
		} );

		test( 'does not include resolution in options when set to countries (default)', () => {
			renderWithTheme();

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.resolution ).toBeUndefined();
		} );

		test( 'passes region to Google Charts when not world', () => {
			renderWithTheme( { region: 'US' } );

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.region ).toBe( 'US' );
		} );

		test( 'passes resolution to Google Charts when not countries', () => {
			renderWithTheme( { resolution: 'provinces' } );

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.resolution ).toBe( 'provinces' );
		} );

		test( 'passes both region and resolution for US states view', () => {
			const stateData = [
				[ 'State', 'Value' ],
				[ 'California', 100 ],
				[ 'Texas', 50 ],
			] as [ string[], ...[ string, number ][] ];

			renderWithTheme( {
				region: 'US',
				resolution: 'provinces',
				data: stateData,
			} );

			const chartOptions = screen.getByTestId( 'chart-options' );
			const options = JSON.parse( chartOptions.textContent || '{}' );

			expect( options.region ).toBe( 'US' );
			expect( options.resolution ).toBe( 'provinces' );
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
