import { render, screen } from '@testing-library/react';
import useFallbackColors from '../use-fallback-colors';

// Simple test component
function TestComponent( { style } ) {
	const [ fallbacks, ref ] = useFallbackColors();
	return (
		<div data-testid="fallbacks" style={ style } ref={ ref }>
			{ fallbacks?.fallbackBackgroundColor },{ fallbacks?.fallbackTextColor }
		</div>
	);
}

describe( 'useFallbackColors', () => {
	it( 'detects initial styles', async () => {
		render( <TestComponent style={ { backgroundColor: 'red', color: 'white' } } /> );
		const fallbacks = await screen.findByTestId( 'fallbacks' );
		expect( fallbacks ).toHaveTextContent( 'red,white' );
	} );

	it( 'updates when styles change', async () => {
		const { rerender } = render(
			<TestComponent style={ { backgroundColor: 'red', color: 'white' } } />
		);
		let fallbacks = await screen.findByTestId( 'fallbacks' );

		// Initial state check
		expect( fallbacks ).toHaveTextContent( 'red,white' );

		// Re-render with new colors
		rerender( <TestComponent style={ { backgroundColor: 'blue', color: 'yellow' } } /> );

		fallbacks = await screen.findByTestId( 'fallbacks' );

		// Wait for and verify the update
		expect( fallbacks ).toHaveTextContent( 'blue,yellow' );
	} );

	it( 'cleans up the MutationObserver on unmount', () => {
		const disconnect = jest.fn();
		const observe = jest.fn();

		// Mock MutationObserver
		const originalMutationObserver = window.MutationObserver;
		jest.spyOn( window, 'MutationObserver' ).mockImplementation( () => ( {
			observe,
			disconnect,
		} ) );

		const { unmount } = render( <TestComponent /> );

		expect( observe ).toHaveBeenCalledTimes( 1 );

		unmount();

		expect( disconnect ).toHaveBeenCalledTimes( 1 );

		// Cleanup
		window.MutationObserver = originalMutationObserver;
	} );
} );
