import { render, screen } from '@testing-library/react';
import { useTextTruncation } from '../use-text-truncation';

// Mock ResizeObserver
jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => ( {
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
} ) );

const TestComponent = ( {
	enabled = true,
	text = 'Test text',
}: {
	enabled?: boolean;
	text?: string;
} ) => {
	const [ ref, isTruncated ] = useTextTruncation( enabled );

	return (
		<div>
			<span ref={ ref } data-testid="text-element">
				{ text }
			</span>
			<span data-testid="truncated-status">{ isTruncated ? 'truncated' : 'not-truncated' }</span>
		</div>
	);
};

describe( 'useTextTruncation', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	test( 'returns ref callback and truncation status', () => {
		render( <TestComponent /> );

		expect( screen.getByTestId( 'text-element' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'truncated-status' ) ).toBeInTheDocument();
	} );

	test( 'initializes with not truncated state', () => {
		render( <TestComponent /> );

		expect( screen.getByTestId( 'truncated-status' ) ).toHaveTextContent( 'not-truncated' );
	} );

	test( 'sets up ResizeObserver when enabled', () => {
		render( <TestComponent enabled={ true } /> );

		expect( globalThis.ResizeObserver ).toHaveBeenCalled();
	} );

	test( 'does not set up ResizeObserver when disabled', () => {
		render( <TestComponent enabled={ false } /> );

		// ResizeObserver should not be called when disabled
		expect( globalThis.ResizeObserver ).not.toHaveBeenCalled();
	} );

	test( 'cleans up ResizeObserver on unmount', () => {
		const mockDisconnect = jest.fn();
		( globalThis.ResizeObserver as jest.Mock ).mockImplementation( () => ( {
			observe: jest.fn(),
			unobserve: jest.fn(),
			disconnect: mockDisconnect,
		} ) );

		const { unmount } = render( <TestComponent enabled={ true } /> );

		unmount();

		expect( mockDisconnect ).toHaveBeenCalled();
	} );

	test( 'updates state when enabled prop changes', () => {
		const { rerender } = render( <TestComponent enabled={ false } /> );

		// Initially disabled, should show not-truncated
		expect( screen.getByTestId( 'truncated-status' ) ).toHaveTextContent( 'not-truncated' );

		// Enable truncation detection
		rerender( <TestComponent enabled={ true } /> );

		// Should still show not-truncated (as JSDOM doesn't simulate actual truncation)
		expect( screen.getByTestId( 'truncated-status' ) ).toHaveTextContent( 'not-truncated' );
	} );
} );
