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
	const MockComponent = ( { width = 0, height = 0 }: BaseChartProps ) => (
		<div data-testid="responsive-container">
			<div data-testid="mock-component" style={ { width, height } } />
		</div>
	);

	const ResponsiveComponent = withResponsive( MockComponent );

	test( 'renders with default dimensions when no parent size', () => {
		render( <ResponsiveComponent data={ [] } /> );
		const component = screen.getByTestId( 'mock-component' );
		expect( component ).toHaveStyle( { width: '600px' } );
	} );

	test( 'respects maxWidth configuration', () => {
		const ResponsiveWithConfig = withResponsive( MockComponent );
		render( <ResponsiveWithConfig data={ [] } maxWidth={ 400 } /> );
		const component = screen.getByTestId( 'mock-component' );
		expect( component ).toHaveStyle( { width: '400px' } );
	} );

	test( 'applies custom aspect ratio', () => {
		const ResponsiveWithConfig = withResponsive( MockComponent );
		render( <ResponsiveWithConfig data={ [] } aspectRatio={ 0.75 } /> );
		const component = screen.getByTestId( 'mock-component' );
		const styles = window.getComputedStyle( component );
		const height = parseFloat( styles.height );
		const width = parseFloat( styles.width );
		expect( height ).toBe( width * 0.75 );
	} );

	test( 'applies custom debounce time', () => {
		const ResponsiveWithConfig = withResponsive( MockComponent );
		render( <ResponsiveWithConfig data={ [] } resizeDebounceTime={ 100 } /> );
		const component = screen.getByTestId( 'mock-component' );
		expect( component ).toBeInTheDocument();
	} );

	test( 'renders container element', () => {
		render( <ResponsiveComponent data={ [] } /> );
		expect( screen.getByTestId( 'responsive-container' ) ).toBeInTheDocument();
	} );

	describe( 'constrainToParentHeight', () => {
		test( 'caps chart height at parent height when enabled and desired height exceeds parent', () => {
			// With width 600 and aspectRatio 0.75, desired height would be 450
			// But parent height is 300, so it should be capped at 300
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.75 } constrainToParentHeight /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { height: '300px' } );
		} );

		test( 'uses desired height when enabled but desired height is less than parent height', () => {
			// With width 600 and aspectRatio 0.25, desired height would be 150
			// Parent height is 300, so it should use desired height (150)
			render( <ResponsiveComponent data={ [] } aspectRatio={ 0.25 } constrainToParentHeight /> );
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { height: '150px' } );
		} );

		test( 'uses aspect ratio height when disabled regardless of parent height', () => {
			// With width 600 and aspectRatio 0.75, height should be 450 (600 * 0.75)
			// even though parent height is only 300
			render(
				<ResponsiveComponent data={ [] } aspectRatio={ 0.75 } constrainToParentHeight={ false } />
			);
			const component = screen.getByTestId( 'mock-component' );
			expect( component ).toHaveStyle( { height: '450px' } );
		} );

		test( 'container has height 100% when constrainToParentHeight is enabled', () => {
			render( <ResponsiveComponent data={ [] } constrainToParentHeight /> );
			const wrapperDiv = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapperDiv ).toHaveStyle( { height: '100%' } );
		} );

		test( 'container has height auto when constrainToParentHeight is disabled', () => {
			render( <ResponsiveComponent data={ [] } constrainToParentHeight={ false } /> );
			const wrapperDiv = screen.getByTestId( 'responsive-wrapper' );
			expect( wrapperDiv ).toHaveStyle( { height: 'auto' } );
		} );
	} );
} );
