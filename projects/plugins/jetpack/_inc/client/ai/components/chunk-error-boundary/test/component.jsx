import { render, screen } from '@testing-library/react';
import ChunkErrorBoundary from '../index';

// The Notice also announces through an a11y live region; match the visible copy only.
const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

const Broken = () => {
	throw new Error( 'Loading chunk failed' );
};

let consoleError;
beforeEach( () => {
	// React logs the caught error; keep the test output clean.
	consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
} );
afterEach( () => consoleError.mockRestore() );

test( 'renders its children while nothing throws', () => {
	render(
		<ChunkErrorBoundary>
			<p>tab content</p>
		</ChunkErrorBoundary>
	);

	expect( screen.getByText( 'tab content' ) ).toBeInTheDocument();
} );

test( 'shows a reload notice instead of unmounting the page when a child throws', () => {
	render(
		<div>
			<p>rest of the page</p>
			<ChunkErrorBoundary>
				<Broken />
			</ChunkErrorBoundary>
		</div>
	);

	expect( screen.getByText( 'rest of the page' ) ).toBeInTheDocument();
	expect(
		screen.getByText( 'This tab could not be loaded. Reload the page to try again.', IGNORE_A11Y )
	).toBeInTheDocument();
} );
