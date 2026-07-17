import { render, screen } from '@testing-library/react';
import { withResponsive } from '../index';
import type { BaseChartProps } from '../../../../types';

// Mock the useParentSize hook
jest.mock( '@visx/responsive', () => ( {
	useParentSize: jest.fn( () => ( {
		parentRef: () => {},
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
	const DEFAULT_SIZE = { parentRef: () => {}, width: 600, height: 300 };

	// jsdom has no layout engine, so the wrapper's clientHeight (which the contain
	// logic reads from real layout) is always 0. Mock it to simulate the height the
	// parent makes available: 0 means unconstrained (the chart derives its height from
	// width), a positive value simulates a parent that limits the height.
	let mockClientHeight = 0;
	beforeAll( () => {
		Object.defineProperty( window.HTMLElement.prototype, 'clientHeight', {
			configurable: true,
			get() {
				return mockClientHeight;
			},
		} );
	} );

	// Fully clear the mock (queued returns and implementation) after each test, then
	// re-establish the default implementation, so a per-test override can't bleed
	// into the next test.
	afterEach( () => {
		mockClientHeight = 0;
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
			// Parent allows 300px of height; aspectRatio 0.4 derives 600 * 0.4 = 240,
			// which fits, so the chart keeps the full measured width.
			mockClientHeight = 300;
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '600px', height: '240px' } );
		} );

		test( 'contains within the parent height when the parent limits the available height', () => {
			// Parent makes 300px of height available; aspectRatio 0.75 would derive
			// 600 * 0.75 = 450, so both axes shrink to fit: 300 / 0.75 = 400.
			mockClientHeight = 300;
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { width: '400px', height: '300px' } );
		} );

		test( 'derives height from width when the parent has no measured height', () => {
			// parentHeight 0 (unconstrained or not-yet-measured parent): the contain
			// clamp must not run, so the height stays width-derived (600 * 0.4 = 240).
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
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

		test( 'assigns the wrapper to an object-shaped parentRef from useParentSize', () => {
			// useParentSize hands back a callback ref in practice, but older versions
			// return a RefObject; the wrapper must populate that shape too.
			const objectRef: { current: HTMLElement | null } = { current: null };
			useParentSize.mockImplementation( () => ( {
				parentRef: objectRef,
				width: 600,
				height: 300,
			} ) );
			render( <ResponsiveComponent data={ [] } /> );
			expect( objectRef.current ).toBe( screen.getByTestId( 'responsive-wrapper' ) );
		} );
	} );

	describe( 'wrapper dimensions', () => {
		test( 'wrapper has no inline dimensions by default (fills the parent via CSS)', () => {
			render( <ResponsiveComponent data={ [] } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveClass( 'container' );
			expect( wrapper ).not.toHaveClass( 'isContained' );
			expect( wrapper ).not.toHaveAttribute( 'style' );
		} );

		test( 'wrapper uses explicit width/height for dimensions when provided', () => {
			render( <ResponsiveComponent data={ [] } width={ 200 } height={ 200 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveStyle( { width: '200px', height: '200px' } );
		} );

		test( 'wrapper gets the contained class with aspectRatio (centering lives in CSS)', () => {
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.5 } /> );
			const wrapper = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapper ).toHaveClass( 'isContained' );
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

		test( 'content box contains to the parent height when the parent limits the available height', () => {
			// aspectRatio 0.75 derives 450 > the 300px the parent allows, so both axes
			// shrink to fit: width 400 (300 / 0.75) × height 300.
			mockClientHeight = 300;
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			const content = screen.getByTestId( 'responsive-content' );
			expect( content ).toHaveStyle( { width: '400px', height: '300px' } );
		} );
	} );

	describe( 'resize behavior', () => {
		test( 'grows on widen in a fluid (unconstrained-height) parent', () => {
			// Unconstrained parent (mockClientHeight 0): the chart derives its height
			// from width and must grow when the parent widens, not deadlock.
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 0,
			} ) );
			const { rerender } = render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '600px',
				height: '240px',
			} );

			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 900,
				height: 0,
			} ) );
			rerender( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '900px',
				height: '360px',
			} );
		} );

		test( 'stays contained on widen when the parent limits the height', () => {
			// Parent allows 150px of height. aspectRatio 0.4 derives 240 at width 600 and
			// 360 at width 900 — both exceed 150 — so the chart stays contained at
			// 375 × 150 (150 / 0.4 = 375) across the widen rather than overflowing.
			mockClientHeight = 150;
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 150,
			} ) );
			const { rerender } = render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '375px',
				height: '150px',
			} );

			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 900,
				height: 150,
			} ) );
			rerender( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '375px',
				height: '150px',
			} );
		} );

		test( 'releases containment when the parent grows tall enough', () => {
			// Parent starts at 150px of height, so aspectRatio 0.4 (derives 240 at width
			// 600) is contained to 375 × 150.
			mockClientHeight = 150;
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 150,
			} ) );
			const { rerender } = render( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '375px',
				height: '150px',
			} );

			// Parent grows to 300px — now taller than the 240px derived height — so
			// containment releases and the chart returns to its full width-derived size.
			mockClientHeight = 300;
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 300,
			} ) );
			rerender( <ResponsiveComponent data={ [] } aspectRatio={ 0.4 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '600px',
				height: '240px',
			} );
		} );

		test( 'and re-contains to the new height when the parent shrinks further', () => {
			// Parent allows 300px; aspectRatio 0.75 derives 450, so it contains to 400 × 300.
			mockClientHeight = 300;
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 300,
			} ) );
			const { rerender } = render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '400px',
				height: '300px',
			} );

			// Parent shrinks to 150px — still shorter than the 450px derived height — so the
			// chart re-contains to the new available height: 150 / 0.75 = 200 × 150.
			mockClientHeight = 150;
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 150,
			} ) );
			rerender( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '200px',
				height: '150px',
			} );
		} );

		test( 'releases containment when aspectRatio is removed', () => {
			// Contained first (derived 450 > the 300px parent → 400 × 300).
			mockClientHeight = 300;
			useParentSize.mockImplementation( () => ( {
				parentRef: () => {},
				width: 600,
				height: 300,
			} ) );
			const { rerender } = render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } /> );
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '400px',
				height: '300px',
			} );

			// Dropping aspectRatio clears the containment and fills the parent again; the
			// inner content box is gone.
			rerender( <ResponsiveComponent data={ [] } /> );
			expect( screen.queryByTestId( 'responsive-content' ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'mock-component' ) ).toHaveStyle( {
				width: '600px',
				height: '300px',
			} );
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
