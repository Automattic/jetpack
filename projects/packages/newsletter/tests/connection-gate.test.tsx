// The subscribers connect prompt is the gate's fallback view (the branching
// itself lives in `routes/dashboard/stage.tsx`). These tests assert only the
// prompt's own markup + button behavior, with @wordpress/ui stubbed to plain
// elements the way the sibling shell test does.
jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Button: ( {
		children,
		onClick,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	} ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
} ) );

// Imports must come after the jest.mock factories above.
import { render, screen } from '@testing-library/react';
import ConnectionGate from '../_inc/subscribers/components/connection-gate';

describe( 'ConnectionGate (subscribers connect prompt)', () => {
	it( 'renders the connect heading and an enabled Connect button when idle', () => {
		render( <ConnectionGate onConnect={ jest.fn() } isConnecting={ false } /> );

		expect( screen.getByText( 'Connect to manage your subscribers' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Connect' } ) ).toBeEnabled();
	} );

	it( 'invokes onConnect when the button is clicked', () => {
		const onConnect = jest.fn();
		render( <ConnectionGate onConnect={ onConnect } isConnecting={ false } /> );

		// Native click via `.find()` mirrors the sibling shell test; the package
		// doesn't pull in @testing-library/user-event.
		screen
			.getAllByRole( 'button' )
			.find( button => button.textContent === 'Connect' )
			?.click();

		expect( onConnect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows a disabled "Connecting…" button while connecting', () => {
		render( <ConnectionGate onConnect={ jest.fn() } isConnecting={ true } /> );

		expect( screen.getByRole( 'button', { name: 'Connecting…' } ) ).toBeDisabled();
	} );
} );
