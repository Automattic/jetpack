import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../index';

/**
 * Test helper that throws during render.
 */
function Boom(): null {
	throw new Error( 'Minified React error #311; should have a queue.' );
}

describe( 'ErrorBoundary', () => {
	it( 'renders children when there is no error', () => {
		render(
			<ErrorBoundary>
				<span>ok</span>
			</ErrorBoundary>
		);
		expect( screen.getByText( 'ok' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing by default when a child throws', () => {
		const { container } = render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>
		);
		expect( container ).toBeEmptyDOMElement();
		expect( console ).toHaveErrored();
	} );

	it( 'renders the provided fallback when a child throws', () => {
		render(
			<ErrorBoundary fallback={ <span>fallback notice</span> }>
				<Boom />
			</ErrorBoundary>
		);
		expect( screen.getByText( 'fallback notice' ) ).toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );
} );
