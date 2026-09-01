/* eslint-disable testing-library/no-container, testing-library/no-node-access */

import { render, screen } from '@testing-library/react';
import { Sparkline, SparklineUnresponsive } from '../';
import { GlobalChartsProvider, defaultTheme } from '../../../providers';
import { customTheme } from '../../../stories/theme-config';

const THEME_MAP = {
	default: defaultTheme,
	custom: customTheme,
};

describe( 'Sparkline', () => {
	const defaultData = [ 10, 25, 15, 30, 22, 35 ];

	const renderWithTheme = ( props = {}, themeName = 'default' ) => {
		const theme = THEME_MAP[ themeName ];

		return render(
			<GlobalChartsProvider theme={ theme }>
				<Sparkline data={ defaultData } { ...props } />
			</GlobalChartsProvider>
		);
	};

	const renderUnwrappedWithTheme = ( props = {}, themeName = 'default' ) => {
		const theme = THEME_MAP[ themeName ];

		return render(
			<GlobalChartsProvider theme={ theme }>
				<SparklineUnresponsive data={ defaultData } { ...props } />
			</GlobalChartsProvider>
		);
	};

	describe( 'Basic Rendering', () => {
		test( 'renders sparkline with valid data', () => {
			renderUnwrappedWithTheme();
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'applies custom className', () => {
			renderUnwrappedWithTheme( { className: 'custom-class' } );
			const sparkline = screen.getByTestId( 'sparkline' );
			expect( sparkline ).toHaveClass( 'custom-class' );
		} );

		test( 'renders responsive variant', () => {
			renderWithTheme();
			// Responsive variant wraps in a div, so sparkline should exist
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Edge Cases', () => {
		test( 'handles empty data array', () => {
			renderUnwrappedWithTheme( { data: [] } );
			expect( screen.getByTestId( 'sparkline-empty' ) ).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderUnwrappedWithTheme( { data: [ 42 ] } );
			const singlePoint = screen.getByTestId( 'sparkline-single-point' );
			expect( singlePoint ).toBeInTheDocument();
			// Should render a circle
			const circle = singlePoint.querySelector( 'circle' );
			expect( circle ).toBeInTheDocument();
		} );

		test( 'handles two data points', () => {
			renderUnwrappedWithTheme( { data: [ 10, 20 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderUnwrappedWithTheme( { data: [ -10, -5, 0, 5, 10 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles flat line (all same values)', () => {
			renderUnwrappedWithTheme( { data: [ 50, 50, 50, 50 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Styling Props', () => {
		test( 'applies custom color', () => {
			const { container } = renderUnwrappedWithTheme( { color: '#ff0000' } );
			// Check that SVG contains a path with the custom color
			const path = container.querySelector( 'path[stroke="#ff0000"]' );
			expect( path ).toBeInTheDocument();
		} );

		test( 'applies custom stroke width', () => {
			const { container } = renderUnwrappedWithTheme( { strokeWidth: 4 } );
			const path = container.querySelector( 'path[stroke-width="4"]' );
			expect( path ).toBeInTheDocument();
		} );

		test( 'renders with gradient fill by default', () => {
			const { container } = renderUnwrappedWithTheme();
			// Check for LinearGradient in SVG
			const gradient = container.querySelector( 'linearGradient' );
			expect( gradient ).toBeInTheDocument();
		} );

		test( 'disables gradient fill when withGradientFill is false', () => {
			const { container } = renderUnwrappedWithTheme( { withGradientFill: false } );
			// Should not have gradient
			const gradient = container.querySelector( 'linearGradient' );
			expect( gradient ).not.toBeInTheDocument();
		} );

		test( 'applies custom gradient config', () => {
			const { container } = renderUnwrappedWithTheme( {
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
			const { container } = renderUnwrappedWithTheme();
			const svg = container.querySelector( 'svg' );
			expect( svg ).toHaveAttribute( 'width', '100' );
			expect( svg ).toHaveAttribute( 'height', '40' );
		} );

		test( 'applies custom dimensions', () => {
			const { container } = renderUnwrappedWithTheme( { width: 200, height: 80 } );
			const svg = container.querySelector( 'svg' );
			expect( svg ).toHaveAttribute( 'width', '200' );
			expect( svg ).toHaveAttribute( 'height', '80' );
		} );

		test( 'applies custom margin', () => {
			renderUnwrappedWithTheme( { margin: { top: 10, right: 10, bottom: 10, left: 10 } } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Theme Integration', () => {
		test( 'uses default theme colors', () => {
			const { container } = renderUnwrappedWithTheme( {}, 'default' );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
			// Should render with theme color if no color prop provided
			const path = container.querySelector( 'path[stroke]' );
			expect( path ).toBeInTheDocument();
		} );

		test( 'uses custom theme colors', () => {
			const { container } = renderUnwrappedWithTheme( {}, 'custom' );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
			const path = container.querySelector( 'path[stroke]' );
			expect( path ).toBeInTheDocument();
		} );

		test( 'color prop overrides theme color', () => {
			const { container } = renderUnwrappedWithTheme( { color: '#custom' }, 'default' );
			const path = container.querySelector( 'path[stroke="#custom"]' );
			expect( path ).toBeInTheDocument();
		} );
	} );

	describe( 'Data Transformation', () => {
		test( 'handles large datasets', () => {
			const largeData = Array.from( { length: 100 }, ( _, i ) => i * 2 );
			renderUnwrappedWithTheme( { data: largeData } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles small datasets', () => {
			renderUnwrappedWithTheme( { data: [ 1, 2 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );

		test( 'handles data with large range', () => {
			renderUnwrappedWithTheme( { data: [ 1, 1000, 50, 500 ] } );
			expect( screen.getByTestId( 'sparkline' ) ).toBeInTheDocument();
		} );
	} );
} );
