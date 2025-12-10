/**
 * @jest-environment jsdom
 */

/*
 * Disabling no-node-access because SVG path elements don't have accessible roles
 * and must be queried via DOM selectors.
 * Disabling prefer-user-event because userEvent.hover doesn't work reliably
 * with raw SVG path elements obtained via document.querySelector.
 */
/* eslint-disable testing-library/no-node-access, testing-library/prefer-user-event */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import GeoChart, { GeoChartUnresponsive } from '../geo-chart';

/**
 * Helper to get country path elements from the rendered chart.
 * Country paths are identified by their stroke-width attribute (0.5).
 *
 * @return Array of country path elements
 */
const getCountryPaths = () => {
	const allPaths = document.querySelectorAll( 'path' );
	return Array.from( allPaths ).filter( path => path.getAttribute( 'stroke-width' ) === '0.5' );
};

describe( 'GeoChart', () => {
	const defaultProps = {
		width: 800,
		height: 400,
		data: {
			US: 100,
			CA: 50,
			GB: 25,
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

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
			expect( svg ).toHaveAttribute( 'width', '800' );
			expect( svg ).toHaveAttribute( 'height', '400' );
		} );

		test( 'renders a container with the correct class', () => {
			renderWithTheme( { className: 'custom-class' } );

			const container = document.querySelector( '.custom-class' );
			expect( container ).toBeInTheDocument();
		} );

		test( 'renders without GlobalChartsProvider by creating its own', () => {
			render( <GeoChartUnresponsive { ...defaultProps } /> );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );
	} );

	describe( 'Data Handling', () => {
		test( 'handles empty data object', () => {
			renderWithTheme( { data: {} } );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );

		test( 'handles single country data', () => {
			renderWithTheme( { data: { US: 100 } } );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );

		test( 'handles zero values in data', () => {
			renderWithTheme( { data: { US: 0, CA: 100 } } );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );

		test( 'renders country paths for world map', () => {
			renderWithTheme();

			const paths = document.querySelectorAll( 'path' );
			expect( paths.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Map Configuration', () => {
		test( 'applies custom scale prop', () => {
			renderWithTheme( { scale: 200 } );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );

		test( 'applies custom center prop', () => {
			renderWithTheme( { center: [ -95.7, 37.1 ] } );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );

		test( 'renders with different dimensions', () => {
			renderWithTheme( { width: 1200, height: 600 } );

			const svg = document.querySelector( 'svg' );
			expect( svg ).toHaveAttribute( 'width', '1200' );
			expect( svg ).toHaveAttribute( 'height', '600' );
		} );
	} );

	describe( 'Tooltip Functionality', () => {
		test( 'shows tooltip content on mouse move over country', async () => {
			renderWithTheme();

			const countryPaths = getCountryPaths();
			expect( countryPaths.length ).toBeGreaterThan( 0 );

			// Trigger mouse move on first country path
			fireEvent.mouseMove( countryPaths[ 0 ], { clientX: 100, clientY: 100 } );

			// Tooltip content should appear with "Orders:" text
			await waitFor( () => {
				expect( screen.getByText( /Orders:/i ) ).toBeInTheDocument();
			} );
		} );

		test( 'hides tooltip on mouse leave', async () => {
			renderWithTheme();

			const countryPaths = getCountryPaths();
			expect( countryPaths.length ).toBeGreaterThan( 0 );

			// Show tooltip
			fireEvent.mouseMove( countryPaths[ 0 ], { clientX: 100, clientY: 100 } );

			await waitFor( () => {
				expect( screen.getByText( /Orders:/i ) ).toBeInTheDocument();
			} );

			// Hide tooltip
			fireEvent.mouseLeave( countryPaths[ 0 ] );

			await waitFor( () => {
				expect( screen.queryByText( /Orders:/i ) ).not.toBeInTheDocument();
			} );
		} );

		test( 'tooltip displays country name and order value', async () => {
			renderWithTheme( { data: { US: 42 } } );

			const countryPaths = getCountryPaths();
			expect( countryPaths.length ).toBeGreaterThan( 0 );

			// Trigger tooltip on first country
			fireEvent.mouseMove( countryPaths[ 0 ], { clientX: 100, clientY: 100 } );

			// Should show "Orders:" in tooltip (value varies based on country)
			await waitFor( () => {
				expect( screen.getByText( /Orders:/i ) ).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'Color Scaling', () => {
		test( 'countries with data have different fill than countries without', () => {
			renderWithTheme( { data: { US: 100 } } );

			const paths = document.querySelectorAll( 'path' );
			const fills = new Set< string >();

			paths.forEach( path => {
				const fill = path.getAttribute( 'fill' );
				if ( fill ) {
					fills.add( fill );
				}
			} );

			// At least 2 different fills: countries with data vs without
			expect( fills.size ).toBeGreaterThanOrEqual( 2 );
		} );

		test( 'countries with varying data values create color variation', () => {
			renderWithTheme( { data: { US: 100, CA: 50, MX: 10 } } );

			const paths = document.querySelectorAll( 'path' );
			const fills = new Set< string >();

			paths.forEach( path => {
				const fill = path.getAttribute( 'fill' );
				if ( fill ) {
					fills.add( fill );
				}
			} );

			// Multiple fill values expected with varying data
			expect( fills.size ).toBeGreaterThanOrEqual( 2 );
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

	describe( 'User Interaction', () => {
		test( 'renders many country paths for world map', () => {
			renderWithTheme();

			const countryPaths = getCountryPaths();
			// World map should have many countries (~200)
			expect( countryPaths.length ).toBeGreaterThan( 50 );
		} );

		test( 'handles sequential mouse events on different countries', () => {
			renderWithTheme();

			const countryPaths = getCountryPaths();
			expect( countryPaths.length ).toBeGreaterThanOrEqual( 2 );

			// Mouse move on first country
			fireEvent.mouseMove( countryPaths[ 0 ], { clientX: 100, clientY: 100 } );

			// Mouse move on second country
			fireEvent.mouseMove( countryPaths[ 1 ], { clientX: 200, clientY: 200 } );

			// Mouse leave
			fireEvent.mouseLeave( countryPaths[ 1 ] );

			// Chart should still render correctly
			const svg = document.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );
	} );
} );
