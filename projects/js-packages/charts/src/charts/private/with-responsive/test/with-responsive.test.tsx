import { render, screen } from '@testing-library/react';
import { withResponsive } from '../index';
import type { BaseChartProps } from '../../../../types';

// Mock the useParentSize hook
jest.mock( '@visx/responsive', () => ( {
	useParentSize: jest.fn( () => ( {
		parentRef: { current: null },
		width: 600, // Default width for tests
		height: 300, // Default height for tests
	} ) ),
} ) );

describe( 'withResponsive', () => {
	const MockComponent = ( { width = 0, height = 0, size = 0 }: BaseChartProps ) => (
		<div data-testid="responsive-container">
			<div data-testid="mock-component" style={ { width, height } } data-size={ size } />
		</div>
	);

	const ResponsiveComponent = withResponsive( MockComponent );

	describe( 'component dimensions', () => {
		test( 'passes measured parent width to component', () => {
			render( <ResponsiveComponent data={ [] } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '600px' } );
		} );

		test( 'passes measured parent height to component when no aspectRatio', () => {
			render( <ResponsiveComponent data={ [] } /> );
			const component = screen.getByTestId( 'mock-component' );
			// Without aspectRatio, height comes from parent (300px in mock)
			expect( component ).toHaveStyle( { height: '300px' } );
		} );

		test( 'calculates height from aspectRatio when provided', () => {
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			const component = screen.getByTestId( 'mock-component' );
			// With aspectRatio, height = width * aspectRatio = 600 * 0.75 = 450
			expect( component ).toHaveStyle( { height: '450px' } );
		} );

		test( 'respects maxWidth configuration', () => {
			render( <ResponsiveComponent data={ [] } maxWidth={ 400 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '400px' } );
		} );

		test( 'passes explicit size prop through to component', () => {
			render( <ResponsiveComponent data={ [] } size={ 200 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveAttribute( 'data-size', '200' );
		} );
	} );

	describe( 'wrapper dimensions', () => {
		test( 'wrapper defaults to 100% width and height when no props', () => {
			render( <ResponsiveComponent data={ [] } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { width: '100%', height: '100%' } );
		} );

		test( 'wrapper uses explicit width/height for dimensions when provided', () => {
			render( <ResponsiveComponent data={ [] } width={ 200 } height={ 200 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { width: '200px', height: '200px' } );
		} );

		test( 'wrapper uses auto height with aspectRatio', () => {
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.5 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { width: '100%', height: 'auto' } );
		} );

		test( 'wrapper expresses aspectRatio in CSS and caps at maxWidth', () => {
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.5 } maxWidth={ 800 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			// CSS aspect-ratio is width/height, so 1 / 0.5 = 2.
			expect( wrapper ).toHaveStyle( { aspectRatio: '2', maxWidth: '800px' } );
		} );

		test( 'wrapper omits the maxWidth cap when an explicit width is set', () => {
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.5 } width={ 300 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { aspectRatio: '2', width: '300px' } );
			expect( wrapper ).not.toHaveStyle( { maxWidth: '1200px' } );
		} );
	} );

	describe( 'configuration', () => {
		test( 'applies custom debounce time without errors', () => {
			render( <ResponsiveComponent data={ [] } resizeDebounceTime={ 100 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toBeInTheDocument();
		} );

		test( 'renders wrapped component container', () => {
			render( <ResponsiveComponent data={ [] } /> );
			expect( screen.getByTestId( 'responsive-container' ) ).toBeInTheDocument();
		} );
	} );
} );
