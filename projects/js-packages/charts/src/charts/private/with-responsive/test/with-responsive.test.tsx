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

	const { useParentSize } = jest.requireMock( '@visx/responsive' );
	const DEFAULT_SIZE = { parentRef: { current: null }, width: 600, height: 300 };
	// Fully clear the mock (queued returns and implementation) after each test, then
	// re-establish the default implementation, so a per-test override can't bleed
	// into the next test.
	afterEach( () => {
		useParentSize.mockReset();
		useParentSize.mockImplementation( () => DEFAULT_SIZE );
	} );

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

		test( 'derives height from width when the parent is taller than the derived height', () => {
			// aspectRatio 0.4: derived height = 600 * 0.4 = 240, which fits the 300px
			// parent, so the chart keeps the full measured width.
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '600px', height: '240px' } );
		} );

		test( 'contains within the parent height when it is shorter than the derived height', () => {
			// aspectRatio 0.75: derived height = 600 * 0.75 = 450 > 300, so both axes
			// shrink to fit the 300px parent while preserving the ratio: 300 / 0.75 = 400.
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '400px', height: '300px' } );
		} );

		test( 'derives height from width when the parent has no measured height', () => {
			// parentHeight 0 (unconstrained or not-yet-measured parent): the contain
			// clamp must not run, so the height stays width-derived (600 * 0.4 = 240).
			useParentSize.mockImplementation( () => ( {
				parentRef: { current: null },
				width: 600,
				height: 0,
			} ) );
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '600px', height: '240px' } );
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

		test( 'wrapper fills the parent (height 100%) with aspectRatio so it can measure both axes', () => {
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.5 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { width: '100%', height: '100%' } );
		} );

		test( 'no content box is rendered without an aspectRatio', () => {
			render( <ResponsiveComponent data={ [] } /> );
			expect( screen.queryByTestId( 'responsive-content' ) ).not.toBeInTheDocument();
		} );

		test( 'renders the contained chart in an inner content box sized to the aspect ratio', () => {
			// aspectRatio 0.4: 600 * 0.4 = 240 fits the 300px parent.
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			const content = screen.getByTestId( 'responsive-content' );
			expect( content ).toHaveStyle( { width: '600px', height: '240px' } );
		} );

		test( 'content box contains to the parent height when it is shorter than the derived height', () => {
			// aspectRatio 0.75: 600 * 0.75 = 450 > 300, so it shrinks to 400 × 300.
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			const content = screen.getByTestId( 'responsive-content' );
			expect( content ).toHaveStyle( { width: '400px', height: '300px' } );
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
