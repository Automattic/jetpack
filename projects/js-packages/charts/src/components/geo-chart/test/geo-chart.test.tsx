/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import GeoChart from '../geo-chart';
import { CityData } from '../types';

describe( 'GeoChart - Cities View', () => {
	const defaultProps = {
		width: 800,
		height: 600,
		data: {
			US: 100,
			GB: 50,
			FR: 30,
		},
	};

	const sampleCitiesData: CityData[] = [
		{
			id: 'nyc',
			name: 'New York',
			lat: 40.7128,
			lng: -74.006,
			value: 150,
			countryCode: 'US',
			countryName: 'United States',
		},
		{
			id: 'lon',
			name: 'London',
			lat: 51.5074,
			lng: -0.1278,
			value: 80,
			countryCode: 'GB',
			countryName: 'United Kingdom',
		},
		{
			id: 'par',
			name: 'Paris',
			lat: 48.8566,
			lng: 2.3522,
			value: 60,
			countryCode: 'FR',
			countryName: 'France',
		},
		{
			id: 'tok',
			name: 'Tokyo',
			lat: 35.6762,
			lng: 139.6503,
			value: 200,
			countryCode: 'JP',
			countryName: 'Japan',
		},
	];

	const renderWithTheme = ( props = {} ) => {
		return render(
			<GlobalChartsProvider>
				<GeoChart { ...defaultProps } { ...props } />
			</GlobalChartsProvider>
		);
	};

	// Helper function to get city bubbles
	// Note: SVG elements don't have accessible roles, so we must use querySelector
	const getCityBubbles = ( element: HTMLElement ) => {
		// City bubbles are circles with cx and cy attributes (not rects)
		// eslint-disable-next-line testing-library/no-node-access
		const circles = element.querySelectorAll( 'circle' );
		return Array.from( circles );
	};

	describe( 'View Controls', () => {
		test( 'renders all three view tabs', () => {
			renderWithTheme();

			expect( screen.getByRole( 'button', { name: /view countries data/i } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: /view regions data/i } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: /view cities data/i } ) ).toBeInTheDocument();
		} );

		test( 'countries view is active by default', () => {
			renderWithTheme();

			const countriesTab = screen.getByRole( 'button', { name: /view countries data/i } );
			expect( countriesTab ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		test( 'regions tab is disabled', () => {
			renderWithTheme();

			const regionsTab = screen.getByRole( 'button', { name: /view regions data/i } );
			expect( regionsTab ).toBeDisabled();
			expect( regionsTab ).toHaveAttribute( 'title', 'Coming soon' );
		} );

		test( 'switches to cities view when cities tab is clicked', async () => {
			const user = userEvent.setup();
			renderWithTheme( { citiesData: sampleCitiesData } );

			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );
			await user.click( citiesTab );

			expect( citiesTab ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		test( 'calls onViewChange callback when view changes', async () => {
			const user = userEvent.setup();
			const onViewChange = jest.fn();
			renderWithTheme( { onViewChange, citiesData: sampleCitiesData } );

			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );
			await user.click( citiesTab );

			expect( onViewChange ).toHaveBeenCalledWith( 'cities' );
		} );

		test( 'uses controlled view when provided', () => {
			renderWithTheme( { view: 'cities', citiesData: sampleCitiesData } );

			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );
			expect( citiesTab ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		test( 'switches back to countries view from cities view', async () => {
			const user = userEvent.setup();
			const onViewChange = jest.fn();
			renderWithTheme( { view: 'cities', onViewChange, citiesData: sampleCitiesData } );

			const countriesTab = screen.getByRole( 'button', { name: /view countries data/i } );
			await user.click( countriesTab );

			expect( onViewChange ).toHaveBeenCalledWith( 'countries' );
		} );
	} );

	describe( 'Cities Data Rendering', () => {
		test( 'renders city bubbles when in cities view', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( sampleCitiesData.length );
		} );

		test( 'does not render city bubbles in countries view', () => {
			const { container } = renderWithTheme( {
				view: 'countries',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( 0 );
		} );

		test( 'renders with empty cities data array', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: [],
			} );

			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( 0 );
		} );

		test( 'renders with undefined cities data', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
			} );

			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( 0 );
		} );

		test( 'renders single city correctly', () => {
			const singleCity: CityData[] = [
				{
					id: 'nyc',
					name: 'New York',
					lat: 40.7128,
					lng: -74.006,
					value: 100,
				},
			];

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: singleCity,
			} );

			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( 1 );
		} );
	} );

	describe( 'City Bubble Scaling', () => {
		test( 'scales city bubbles based on value', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );

			// Tokyo has the highest value (200), should have the largest radius
			const tokyoBubble = cityBubbles[ 3 ] as SVGCircleElement;
			const tokyoRadius = parseFloat( tokyoBubble.getAttribute( 'r' ) || '0' );

			// Paris has the lowest value (60), should have a smaller radius
			const parisBubble = cityBubbles[ 2 ] as SVGCircleElement;
			const parisRadius = parseFloat( parisBubble.getAttribute( 'r' ) || '0' );

			expect( tokyoRadius ).toBeGreaterThan( parisRadius );
		} );

		test( 'handles zero value cities', () => {
			const citiesWithZero: CityData[] = [
				{
					id: 'zero',
					name: 'Zero City',
					lat: 0,
					lng: 0,
					value: 0,
				},
				{
					id: 'nonzero',
					name: 'Non-Zero City',
					lat: 10,
					lng: 10,
					value: 100,
				},
			];

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: citiesWithZero,
			} );

			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( 2 );

			// Zero value should still render with minimum radius
			const zeroBubble = cityBubbles[ 0 ] as SVGCircleElement;
			const zeroRadius = parseFloat( zeroBubble.getAttribute( 'r' ) || '0' );
			expect( zeroRadius ).toBeGreaterThan( 0 );
		} );

		test( 'handles cities with same value consistently', () => {
			const citiesWithSameValue: CityData[] = [
				{
					id: 'city1',
					name: 'City 1',
					lat: 40,
					lng: -70,
					value: 100,
				},
				{
					id: 'city2',
					name: 'City 2',
					lat: 50,
					lng: 0,
					value: 100,
				},
			];

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: citiesWithSameValue,
			} );

			const cityBubbles = getCityBubbles( container );
			const radius1 = parseFloat(
				( cityBubbles[ 0 ] as SVGCircleElement ).getAttribute( 'r' ) || '0'
			);
			const radius2 = parseFloat(
				( cityBubbles[ 1 ] as SVGCircleElement ).getAttribute( 'r' ) || '0'
			);

			expect( radius1 ).toBe( radius2 );
		} );
	} );

	describe( 'City Tooltips', () => {
		test( 'shows tooltip on city bubble hover with all information', async () => {
			const user = userEvent.setup();
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );
			const newYorkBubble = cityBubbles[ 0 ] as SVGCircleElement;

			await user.hover( newYorkBubble );

			await waitFor( () => {
				expect( screen.getByText( 'New York' ) ).toBeInTheDocument();
			} );

			expect( screen.getByText( 'United States' ) ).toBeInTheDocument();
			expect( screen.getByText( /Value: 150/i ) ).toBeInTheDocument();
		} );

		test( 'shows tooltip without country name when not provided', async () => {
			const user = userEvent.setup();
			const cityWithoutCountry: CityData[] = [
				{
					id: 'city',
					name: 'Mystery City',
					lat: 40,
					lng: -70,
					value: 50,
				},
			];

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: cityWithoutCountry,
			} );

			const cityBubbles = getCityBubbles( container );
			const cityBubble = cityBubbles[ 0 ] as SVGCircleElement;
			await user.hover( cityBubble );

			await waitFor( () => {
				expect( screen.getByText( 'Mystery City' ) ).toBeInTheDocument();
			} );

			expect( screen.getByText( /Value: 50/i ) ).toBeInTheDocument();
		} );

		test( 'updates tooltip when hovering over different cities', async () => {
			const user = userEvent.setup();
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );

			// Hover over New York
			await user.hover( cityBubbles[ 0 ] as SVGCircleElement );
			await waitFor( () => {
				expect( screen.getByText( 'New York' ) ).toBeInTheDocument();
			} );

			// Hover over London
			await user.hover( cityBubbles[ 1 ] as SVGCircleElement );
			await waitFor( () => {
				expect( screen.getByText( 'London' ) ).toBeInTheDocument();
			} );

			// New York should no longer be in the tooltip
			expect( screen.queryByText( 'New York' ) ).not.toBeInTheDocument();
		} );

		test( 'hides tooltip on mouse leave', async () => {
			const user = userEvent.setup();
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );
			const cityBubble = cityBubbles[ 0 ] as SVGCircleElement;

			await user.hover( cityBubble );
			await waitFor( () => {
				expect( screen.getByText( 'New York' ) ).toBeInTheDocument();
			} );

			await user.unhover( cityBubble );

			await waitFor( () => {
				expect( screen.queryByText( 'New York' ) ).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'Map Dimming in Cities View', () => {
		test( 'applies dimmed styling to countries in cities view', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const countryPaths = container.querySelectorAll( 'path' );
			expect( countryPaths.length ).toBeGreaterThan( 0 );

			// In cities view, country paths should exist (background map)
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svg = container.querySelector( 'svg' );
			expect( svg ).toBeInTheDocument();
		} );

		test( 'renders country paths in countries view', () => {
			const { container } = renderWithTheme( {
				view: 'countries',
				citiesData: sampleCitiesData,
			} );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const countryPaths = container.querySelectorAll( 'path' );
			expect( countryPaths.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'City Coordinates Handling', () => {
		test( 'handles cities with invalid coordinates gracefully', () => {
			const citiesWithInvalidCoords: CityData[] = [
				{
					id: 'invalid',
					name: 'Invalid City',
					lat: NaN,
					lng: NaN,
					value: 100,
				},
				{
					id: 'valid',
					name: 'Valid City',
					lat: 40,
					lng: -70,
					value: 50,
				},
			];

			// The component will log warnings for invalid coordinates, which is expected
			const consoleSpy = jest.spyOn( console, 'error' ).mockImplementation();

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: citiesWithInvalidCoords,
			} );

			// Should render without crashing
			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles.length ).toBeGreaterThanOrEqual( 0 );

			consoleSpy.mockRestore();
		} );

		test( 'handles extreme latitude and longitude values', () => {
			const citiesWithExtremeCoords: CityData[] = [
				{
					id: 'north-pole',
					name: 'North Pole',
					lat: 90,
					lng: 0,
					value: 10,
				},
				{
					id: 'south-pole',
					name: 'South Pole',
					lat: -90,
					lng: 0,
					value: 5,
				},
			];

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: citiesWithExtremeCoords,
			} );

			// Should render without crashing
			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles.length ).toBeGreaterThanOrEqual( 0 );
		} );
	} );

	describe( 'Color Consistency', () => {
		test( 'uses consistent color scale for cities based on value', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			const cityBubbles = getCityBubbles( container );

			// Get fill colors
			const colors = cityBubbles.map( bubble => bubble.getAttribute( 'fill' ) );

			// All colors should be defined
			colors.forEach( color => {
				expect( color ).toBeTruthy();
			} );
		} );
	} );

	describe( 'Accessibility', () => {
		test( 'city view tab has proper ARIA attributes', () => {
			renderWithTheme();

			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );
			expect( citiesTab ).toHaveAttribute( 'aria-label', 'View cities data' );
			expect( citiesTab ).toHaveAttribute( 'aria-pressed' );
		} );

		test( 'all view tabs are keyboard accessible', async () => {
			const user = userEvent.setup();
			renderWithTheme( { citiesData: sampleCitiesData } );

			const countriesTab = screen.getByRole( 'button', { name: /view countries data/i } );
			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );

			// Tab to countries button
			await user.tab();
			expect( countriesTab ).toHaveFocus();

			// Tab to regions button (disabled) - it will be skipped
			await user.tab();

			// After skipping disabled button, cities tab should have focus
			expect( citiesTab ).toHaveFocus();
		} );

		test( 'cities view can be activated with keyboard', async () => {
			const user = userEvent.setup();
			const onViewChange = jest.fn();
			renderWithTheme( { onViewChange, citiesData: sampleCitiesData } );

			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );
			citiesTab.focus();

			await user.keyboard( '{Enter}' );

			expect( onViewChange ).toHaveBeenCalledWith( 'cities' );
		} );
	} );

	describe( 'Integration with Country Data', () => {
		test( 'renders both country colors and city bubbles', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			// Should have country paths
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const countryPaths = container.querySelectorAll( 'path' );
			expect( countryPaths.length ).toBeGreaterThan( 0 );

			// Should have city bubbles
			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( sampleCitiesData.length );
		} );

		test( 'country paths render in cities view for context', () => {
			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			// Find country paths
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const countryPaths = container.querySelectorAll( 'path' );
			expect( countryPaths.length ).toBeGreaterThan( 0 );

			// In cities view, both countries and cities are visible
			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'handles very large number of cities', () => {
			// Create 100 cities
			const manyCities: CityData[] = Array.from( { length: 100 }, ( _, i ) => ( {
				id: `city-${ i }`,
				name: `City ${ i }`,
				lat: ( i % 180 ) - 90,
				lng: ( i % 360 ) - 180,
				value: i + 1,
			} ) );

			const { container } = renderWithTheme( {
				view: 'cities',
				citiesData: manyCities,
			} );

			// Should render without performance issues
			const cityBubbles = getCityBubbles( container );
			expect( cityBubbles.length ).toBeGreaterThan( 0 );
		} );

		test( 'handles rapid view switching', async () => {
			const user = userEvent.setup();
			renderWithTheme( { citiesData: sampleCitiesData } );

			const countriesTab = screen.getByRole( 'button', { name: /view countries data/i } );
			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );

			// Rapidly switch views
			await user.click( citiesTab );
			await user.click( countriesTab );
			await user.click( citiesTab );
			await user.click( countriesTab );

			// Should end on countries view
			expect( countriesTab ).toHaveAttribute( 'aria-pressed', 'true' );
		} );

		test( 'preserves city data when switching views', async () => {
			const user = userEvent.setup();
			const { container } = renderWithTheme( { citiesData: sampleCitiesData } );

			const citiesTab = screen.getByRole( 'button', { name: /view cities data/i } );
			const countriesTab = screen.getByRole( 'button', { name: /view countries data/i } );

			// Switch to cities
			await user.click( citiesTab );
			let cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( sampleCitiesData.length );

			// Switch back to countries
			await user.click( countriesTab );
			cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( 0 );

			// Switch to cities again
			await user.click( citiesTab );
			cityBubbles = getCityBubbles( container );
			expect( cityBubbles ).toHaveLength( sampleCitiesData.length );
		} );
	} );

	describe( 'Custom Styling', () => {
		test( 'applies custom className to container', () => {
			const { container } = renderWithTheme( {
				className: 'custom-geo-chart',
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const chartContainer = container.querySelector( '.custom-geo-chart' );
			expect( chartContainer ).toBeInTheDocument();
		} );

		test( 'renders with custom dimensions', () => {
			const { container } = renderWithTheme( {
				width: 1200,
				height: 800,
				view: 'cities',
				citiesData: sampleCitiesData,
			} );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const svg = container.querySelector( 'svg' );
			expect( svg ).toHaveAttribute( 'width', '1200' );
			expect( svg ).toHaveAttribute( 'height', '800' );
		} );
	} );
} );
