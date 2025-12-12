/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import GeoChart, { GeoChartUnresponsive } from '../geo-chart';

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
		test( 'renders an SVG element with correct dimensions', () => {
			renderWithTheme();

			const svg = screen.getByTestId( 'geo-chart-svg' );
			expect( svg ).toBeInTheDocument();
			expect( svg ).toHaveAttribute( 'width', '800' );
			expect( svg ).toHaveAttribute( 'height', '400' );
		} );

		test( 'renders a container with the correct class', () => {
			renderWithTheme( { className: 'custom-class' } );

			const container = screen.getByTestId( 'geo-chart' );
			expect( container ).toHaveClass( 'custom-class' );
		} );

		test( 'renders without GlobalChartsProvider by creating its own', () => {
			render( <GeoChartUnresponsive { ...defaultProps } /> );

			expect( screen.getByTestId( 'geo-chart-svg' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Data Handling', () => {
		test( 'handles empty data object', () => {
			renderWithTheme( { data: {} } );

			expect( screen.getByTestId( 'geo-chart-svg' ) ).toBeInTheDocument();
		} );

		test( 'handles single country data', () => {
			renderWithTheme( { data: { USA: 100 } } );

			expect( screen.getByTestId( 'geo-chart-country-USA' ) ).toBeInTheDocument();
		} );

		test( 'handles zero values in data', () => {
			renderWithTheme( { data: { USA: 0, CAN: 100 } } );

			expect( screen.getByTestId( 'geo-chart-country-USA' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart-country-CAN' ) ).toBeInTheDocument();
		} );

		test( 'renders country paths for world map', () => {
			renderWithTheme();

			// Check that multiple countries are rendered
			expect( screen.getByTestId( 'geo-chart-country-USA' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart-country-CAN' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart-country-GBR' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Map Configuration', () => {
		test( 'applies custom scale prop', () => {
			renderWithTheme( { scale: 200 } );

			expect( screen.getByTestId( 'geo-chart-svg' ) ).toBeInTheDocument();
		} );

		test( 'renders with different dimensions', () => {
			renderWithTheme( { width: 1200, height: 600 } );

			const svg = screen.getByTestId( 'geo-chart-svg' );
			expect( svg ).toHaveAttribute( 'width', '1200' );
			expect( svg ).toHaveAttribute( 'height', '600' );
		} );
	} );

	/* eslint-disable testing-library/prefer-user-event -- fireEvent needed for SVG path mouse events */
	describe( 'Tooltip Functionality', () => {
		test( 'tooltip displays country name and value', async () => {
			renderWithTheme( { data: { USA: 42 } } );

			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );

			// Trigger tooltip on USA
			fireEvent.mouseMove( usaPath, { clientX: 100, clientY: 100 } );

			// Should show country name and numeric value in tooltip
			await waitFor( () => {
				expect( screen.getByTestId( 'geo-chart-tooltip' ) ).toBeInTheDocument();
			} );
			const tooltip = screen.getByTestId( 'geo-chart-tooltip' );
			expect( tooltip ).toHaveTextContent( 'United States' );
			expect( tooltip ).toHaveTextContent( '42' );
		} );

		test( 'hides tooltip on mouse leave', async () => {
			renderWithTheme();

			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );

			// Show tooltip
			fireEvent.mouseMove( usaPath, { clientX: 100, clientY: 100 } );

			await waitFor( () => {
				expect( screen.getByTestId( 'geo-chart-tooltip' ) ).toBeInTheDocument();
			} );

			// Hide tooltip
			fireEvent.mouseLeave( usaPath );

			await waitFor( () => {
				expect( screen.queryByTestId( 'geo-chart-tooltip' ) ).not.toBeInTheDocument();
			} );
		} );

		test( 'tooltip updates when switching between countries', async () => {
			renderWithTheme();

			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );
			const canPath = screen.getByTestId( 'geo-chart-country-CAN' );

			// Hover on USA
			fireEvent.mouseMove( usaPath, { clientX: 100, clientY: 100 } );

			await waitFor( () => {
				expect( screen.getByTestId( 'geo-chart-tooltip' ) ).toHaveTextContent( 'United States' );
			} );

			// Move to Canada
			fireEvent.mouseMove( canPath, { clientX: 200, clientY: 200 } );

			await waitFor( () => {
				expect( screen.getByTestId( 'geo-chart-tooltip' ) ).toHaveTextContent( 'Canada' );
			} );
		} );
	} );
	/* eslint-enable testing-library/prefer-user-event */

	describe( 'Color Scaling', () => {
		test( 'countries with data have different fill than countries without', () => {
			renderWithTheme( { data: { USA: 100 } } );

			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );
			const canPath = screen.getByTestId( 'geo-chart-country-CAN' );

			// USA has data, CAN doesn't - they should have different fills
			expect( usaPath.getAttribute( 'fill' ) ).not.toBe( canPath.getAttribute( 'fill' ) );
		} );

		test( 'countries with varying data values have different fill intensities', () => {
			renderWithTheme( { data: { USA: 100, CAN: 50 } } );

			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );
			const canPath = screen.getByTestId( 'geo-chart-country-CAN' );

			// Both have data but different values - should have different fills
			expect( usaPath.getAttribute( 'fill' ) ).not.toBe( canPath.getAttribute( 'fill' ) );
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
