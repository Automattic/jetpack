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

	it( 'shows the default fallback instead of crashing', () => {
		render(
			<ErrorBoundary>
				<Boom />
			</ErrorBoundary>
		);
		expect( screen.getAllByText( 'Unable to load the sharing status.' )[ 0 ] ).toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );

	it( 'renders a custom fallback when provided', () => {
		render(
			<ErrorBoundary fallback={ <span>custom fallback</span> }>
				<Boom />
			</ErrorBoundary>
		);
		expect( screen.getByText( 'custom fallback' ) ).toBeInTheDocument();
		expect( console ).toHaveErrored();
	} );
} );
