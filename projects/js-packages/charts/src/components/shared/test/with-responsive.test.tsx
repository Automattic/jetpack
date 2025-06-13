import { render, screen } from '@testing-library/react';
import { withResponsive } from '../with-responsive';
import type { BaseChartProps } from '../../../types';

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
} );
