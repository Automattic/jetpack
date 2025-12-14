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

	// Helper to wait for the chart to finish loading the topology
	const waitForChartToLoad = async () => {
		return screen.findByTestId( 'geo-chart-svg' );
	};

	describe( 'Basic Rendering', () => {
		test( 'renders an SVG element with correct dimensions', async () => {
			renderWithTheme();

			const svg = await waitForChartToLoad();
			expect( svg ).toBeInTheDocument();
			expect( svg ).toHaveAttribute( 'width', '800' );
			expect( svg ).toHaveAttribute( 'height', '400' );
		} );

		test( 'renders a container with the correct class', async () => {
			renderWithTheme( { className: 'custom-class' } );

			await waitForChartToLoad();
			const container = screen.getByTestId( 'geo-chart' );
			expect( container ).toHaveClass( 'custom-class' );
		} );

		test( 'renders without GlobalChartsProvider by creating its own', async () => {
			render( <GeoChartUnresponsive { ...defaultProps } /> );

			const svg = await screen.findByTestId( 'geo-chart-svg' );
			expect( svg ).toBeInTheDocument();
		} );
	} );

	describe( 'Data Handling', () => {
		test( 'handles empty data object', async () => {
			renderWithTheme( { data: {} } );

			const svg = await waitForChartToLoad();
			expect( svg ).toBeInTheDocument();
		} );

		test( 'handles single country data', async () => {
			renderWithTheme( { data: { USA: 100 } } );

			await waitForChartToLoad();
			expect( screen.getByTestId( 'geo-chart-country-USA' ) ).toBeInTheDocument();
		} );

		test( 'handles zero values in data', async () => {
			renderWithTheme( { data: { USA: 0, CAN: 100 } } );

			await waitForChartToLoad();
			expect( screen.getByTestId( 'geo-chart-country-USA' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart-country-CAN' ) ).toBeInTheDocument();
		} );

		test( 'renders country paths for world map', async () => {
			renderWithTheme();

			await waitForChartToLoad();
			// Check that multiple countries are rendered
			expect( screen.getByTestId( 'geo-chart-country-USA' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart-country-CAN' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart-country-GBR' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Map Configuration', () => {
		test( 'applies custom scale prop', async () => {
			renderWithTheme( { scale: 200 } );

			const svg = await waitForChartToLoad();
			expect( svg ).toBeInTheDocument();
		} );

		test( 'renders with different dimensions', async () => {
			renderWithTheme( { width: 1200, height: 600 } );

			const svg = await waitForChartToLoad();
			expect( svg ).toHaveAttribute( 'width', '1200' );
			expect( svg ).toHaveAttribute( 'height', '600' );
		} );
	} );

	/* eslint-disable testing-library/prefer-user-event -- fireEvent needed for SVG path mouse events */
	describe( 'Tooltip Functionality', () => {
		test( 'tooltip displays country name and value', async () => {
			renderWithTheme( { data: { USA: 42 } } );

			await waitForChartToLoad();
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

			await waitForChartToLoad();
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

			await waitForChartToLoad();
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
		test( 'countries with data have different fill than countries without', async () => {
			renderWithTheme( { data: { USA: 100 } } );

			await waitForChartToLoad();
			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );
			const canPath = screen.getByTestId( 'geo-chart-country-CAN' );

			// USA has data, CAN doesn't - they should have different fills
			expect( usaPath.getAttribute( 'fill' ) ).not.toBe( canPath.getAttribute( 'fill' ) );
		} );

		test( 'countries with varying data values have different fill intensities', async () => {
			renderWithTheme( { data: { USA: 100, CAN: 50 } } );

			await waitForChartToLoad();
			const usaPath = screen.getByTestId( 'geo-chart-country-USA' );
			const canPath = screen.getByTestId( 'geo-chart-country-CAN' );

			// Both have data but different values - should have different fills
			expect( usaPath.getAttribute( 'fill' ) ).not.toBe( canPath.getAttribute( 'fill' ) );
		} );
	} );

	describe( 'Loading State', () => {
		test( 'shows loading state initially with default text', async () => {
			renderWithTheme();

			const loadingContainer = screen.getByTestId( 'geo-chart-loading' );
			expect( loadingContainer ).toBeInTheDocument();
			expect( loadingContainer ).toHaveTextContent( 'Loading map' );

			// Wait for loading to complete to avoid act() warning
			await waitForChartToLoad();
		} );

		test( 'loading container has correct dimensions', async () => {
			renderWithTheme( { width: 600, height: 300 } );

			const loadingContainer = screen.getByTestId( 'geo-chart-loading' );
			expect( loadingContainer ).toHaveStyle( { width: '600px', height: '300px' } );

			// Wait for loading to complete to avoid act() warning
			await waitForChartToLoad();
		} );

		test( 'uses custom renderPlaceholder when provided', async () => {
			const customPlaceholder = jest.fn( () => (
				<div data-testid="custom-placeholder">Custom loading...</div>
			) );
			renderWithTheme( { renderPlaceholder: customPlaceholder } );

			expect( customPlaceholder ).toHaveBeenCalled();
			expect( screen.getByTestId( 'custom-placeholder' ) ).toBeInTheDocument();
			expect( screen.getByTestId( 'custom-placeholder' ) ).toHaveTextContent( 'Custom loading...' );

			// Wait for loading to complete to avoid act() warning
			await waitForChartToLoad();
		} );

		test( 'loading state is replaced by chart after topology loads', async () => {
			renderWithTheme();

			// Initially shows loading
			expect( screen.getByTestId( 'geo-chart-loading' ) ).toBeInTheDocument();

			// After loading, shows the chart
			await waitForChartToLoad();
			expect( screen.queryByTestId( 'geo-chart-loading' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'geo-chart' ) ).toBeInTheDocument();
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
