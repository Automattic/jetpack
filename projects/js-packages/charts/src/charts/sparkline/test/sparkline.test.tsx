/* eslint-disable testing-library/no-container, testing-library/no-node-access */

import { render, screen } from '@testing-library/react';
import { Sparkline, SparklineUnresponsive } from '../';
import { GlobalChartsProvider } from '../../../providers';

describe( 'Sparkline', () => {
	const defaultData = [ 10, 25, 15, 30, 22, 35 ];

	const renderResponsive = ( props = {} ) =>
		render(
			<GlobalChartsProvider>
				<Sparkline data={ defaultData } { ...props } />
			</GlobalChartsProvider>
		);

	const renderUnwrapped = ( props = {} ) =>
		render(
			<GlobalChartsProvider>
				<SparklineUnresponsive data={ defaultData } { ...props } />
			</GlobalChartsProvider>
		);

	describe( 'Basic Rendering', () => {
		test( 'renders sparkline with valid data', () => {
			renderUnwrapped();
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'applies custom className', () => {
			renderUnwrapped( { className: 'custom-class' } );
			const sparkline = screen.getByTestId( 'sparkline' );
			expect( sparkline ).toHaveClass( 'custom-class' );
		} );

		test( 'renders responsive variant', () => {
			renderResponsive();
			// Responsive variant wraps in a div, so sparkline should exist
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'handles empty data array', () => {
			renderUnwrapped( { data: [] } );
			expect( screen.getByTestId( 'sparkline-empty' ) ).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderUnwrapped( { data: [ 42 ] } );
			const singlePoint = screen.getByTestId( 'sparkline-single-point' );
			expect( singlePoint ).toBeInTheDocument();
			// Should render a circle
			const circle = singlePoint.querySelector( 'circle' );
			expect( circle ).toBeInTheDocument();
		} );

		test( 'handles two data points', () => {
			renderUnwrapped( { data: [ 10, 20 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderUnwrapped( { data: [ -10, -5, 0, 5, 10 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles flat line (all same values)', () => {
			renderUnwrapped( { data: [ 50, 50, 50, 50 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Styling Props', () => {
		test( 'applies custom color', () => {
			const { container } = renderUnwrapped( { color: '#ff0000' } );
			// Check that SVG contains a path with the custom color
			const path = container.querySelector( 'path[stroke="#ff0000"]' );
			expect( path ).toBeInTheDocument();
		} );

		test( 'applies custom stroke width', () => {
			const { container } = renderUnwrapped( { strokeWidth: 4 } );
			const path = container.querySelector( 'path[stroke-width="4"]' );
			expect( path ).toBeInTheDocument();
		} );

		test( 'renders with gradient fill by default', () => {
			const { container } = renderUnwrapped();
			// Check for LinearGradient in SVG
			const gradient = container.querySelector( 'linearGradient' );
			expect( gradient ).toBeInTheDocument();
		} );

		test( 'disables gradient fill when withGradientFill is false', () => {
			const { container } = renderUnwrapped( { withGradientFill: false } );
			// Should not have gradient
			const gradient = container.querySelector( 'linearGradient' );
			expect( gradient ).not.toBeInTheDocument();
		} );

		test( 'applies custom gradient config', () => {
			const { container } = renderUnwrapped( {
				gradient: {
					from: '#00ff00',
					to: '#0000ff',
					fromOpacity: 0.8,
					toOpacity: 0.1,
				},
			} );
			const gradient = container.querySelector( 'linearGradient' );
			expect( gradient ).toBeInTheDocument();
			// Check for color stops
			const stops = gradient?.querySelectorAll( 'stop' );
			expect( stops?.length ).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'Dimensions', () => {
		test( 'applies default dimensions', () => {
			const { container } = renderUnwrapped();
			const svg = container.querySelector( 'svg' );
			expect( svg ).toHaveAttribute( 'width', '100' );
			expect( svg ).toHaveAttribute( 'height', '40' );
		} );

		test( 'applies custom dimensions', () => {
			const { container } = renderUnwrapped( { width: 200, height: 80 } );
			const svg = container.querySelector( 'svg' );
			expect( svg ).toHaveAttribute( 'width', '200' );
			expect( svg ).toHaveAttribute( 'height', '80' );
		} );

		test( 'applies custom margin', () => {
			renderUnwrapped( { margin: { top: 10, right: 10, bottom: 10, left: 10 } } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Color', () => {
		test( 'color prop overrides the palette default', () => {
			const { container } = renderUnwrapped( { color: '#custom' } );
			const path = container.querySelector( 'path[stroke="#custom"]' );
			expect( path ).toBeInTheDocument();
		} );
	} );

	describe( 'Data Transformation', () => {
		test( 'handles large datasets', () => {
			const largeData = Array.from( { length: 100 }, ( _, i ) => i * 2 );
			renderUnwrapped( { data: largeData } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles small datasets', () => {
			renderUnwrapped( { data: [ 1, 2 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles data with large range', () => {
			renderUnwrapped( { data: [ 1, 1000, 50, 500 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );
} );
