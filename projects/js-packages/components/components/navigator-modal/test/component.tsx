/* eslint-disable react/jsx-no-bind */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// ESM-compatible mock - must be before dynamic import
jest.unstable_mockModule( '@wordpress/components', () => ( {
	Modal: ( {
		children,
		onRequestClose,
	}: {
		children: React.ReactNode;
		onRequestClose?: ( event?: React.SyntheticEvent ) => void;
	} ) => (
		<div data-testid="mock-modal">
			<button data-testid="close-with-event" onClick={ e => onRequestClose?.( e ) }>
				Close with event
			</button>
			<button data-testid="close-without-event" onClick={ () => onRequestClose?.() }>
				Close without event
			</button>
			{ children }
		</div>
	),
	Navigator: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="mock-navigator">{ children }</div>
	),
	Button: ( { children, onClick }: { children: React.ReactNode; onClick?: () => void } ) => (
		<button onClick={ onClick }>{ children }</button>
	),
	Flex: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	FlexBlock: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	FlexItem: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	useNavigator: () => ( { goBack: jest.fn(), goTo: jest.fn(), location: { path: '/' } } ),
} ) );

// Dynamic import after mock setup
const { NavigatorModal } = await import( '../index.tsx' );

describe( 'NavigatorModal', () => {
	it( 'renders children within the modal', () => {
		render(
			<NavigatorModal>
				<div data-testid="test-content">Test Content</div>
			</NavigatorModal>
		);

		expect( screen.getByTestId( 'mock-modal' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'test-content' ) ).toBeInTheDocument();
	} );

	describe( 'onRequestClose guard', () => {
		it( 'calls onClose when user-initiated close passes an event', async () => {
			const user = userEvent.setup();
			const mockOnClose = jest.fn();

			render(
				<NavigatorModal onClose={ mockOnClose }>
					<div>Content</div>
				</NavigatorModal>
			);

			await user.click( screen.getByTestId( 'close-with-event' ) );

			expect( mockOnClose ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not call onClose when WordPress Modal dismisser calls onRequestClose without an event', async () => {
			const user = userEvent.setup();
			const mockOnClose = jest.fn();

			render(
				<NavigatorModal onClose={ mockOnClose }>
					<div>Content</div>
				</NavigatorModal>
			);

			await user.click( screen.getByTestId( 'close-without-event' ) );

			expect( mockOnClose ).not.toHaveBeenCalled();
		} );

		it( 'does not crash when onClose is not provided', async () => {
			const user = userEvent.setup();

			render(
				<NavigatorModal>
					<div>Content</div>
				</NavigatorModal>
			);

			// Should not throw when clicking close without onClose handler
			await user.click( screen.getByTestId( 'close-with-event' ) );

			expect( screen.getByTestId( 'mock-modal' ) ).toBeInTheDocument();
		} );
	} );
} );
