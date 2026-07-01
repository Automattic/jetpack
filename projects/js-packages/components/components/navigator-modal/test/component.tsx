/* eslint-disable react/jsx-no-bind */

import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { forwardRef } from 'react';

const mockGoBack = jest.fn();
// ESM-compatible mock - must be before dynamic import
jest.unstable_mockModule( '@wordpress/components', () => ( {
	Modal: forwardRef(
		(
			{
				children,
				onRequestClose,
			}: {
				children: React.ReactNode;
				onRequestClose?: ( event?: React.SyntheticEvent ) => void;
			},
			ref: React.Ref< HTMLDivElement >
		) => (
			<div data-testid="mock-modal" ref={ ref }>
				<button data-testid="close-with-event" onClick={ e => onRequestClose?.( e ) }>
					Close with event
				</button>
				<button data-testid="close-without-event" onClick={ () => onRequestClose?.() }>
					Close without event
				</button>
				{ children }
			</div>
		)
	),
	Navigator: Object.assign(
		( { children }: { children: React.ReactNode } ) => (
			<div data-testid="mock-navigator">{ children }</div>
		),
		{
			Screen: ( { children }: { children: React.ReactNode } ) => (
				<div data-testid="mock-navigator-screen">{ children }</div>
			),
		}
	),
	Button: ( {
		children,
		onClick,
		label,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		label?: string;
	} ) => (
		<button onClick={ onClick } aria-label={ label }>
			{ children }
		</button>
	),
	Flex: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	FlexBlock: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	FlexItem: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	useNavigator: () => ( { goBack: mockGoBack, goTo: jest.fn(), location: { path: '/' } } ),
} ) );

// Dynamic import after mock setup
const { NavigatorModal } = await import( '../index.tsx' );
const { Screen } = await import( '../screen.tsx' );
const { NavigatorModalContext } = await import( '../context.ts' );

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

		it( 'calls onClose on overlay click (pointerdown on the overlay itself, then onRequestClose without event)', async () => {
			const user = userEvent.setup();
			const mockOnClose = jest.fn();

			render(
				<NavigatorModal onClose={ mockOnClose }>
					<div>Content</div>
				</NavigatorModal>
			);

			// A genuine backdrop click: the pointerdown target is the overlay
			// element itself (the mock-modal ref), then WP Modal calls
			// onRequestClose() without an event from its pointerup handler.
			await user.click( screen.getByTestId( 'mock-modal' ) );
			await user.click( screen.getByTestId( 'close-without-event' ) );

			expect( mockOnClose ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not close when an inner control opens another modal (dismisser fires onRequestClose without event)', async () => {
			const user = userEvent.setup();
			const mockOnClose = jest.fn();

			render(
				<NavigatorModal onClose={ mockOnClose }>
					<button data-testid="inner-control">Generate image</button>
				</NavigatorModal>
			);

			// Regression for SOCIAL-477: pressing a control inside the modal (e.g.
			// "Generate image") must not mark the next eventless onRequestClose as a
			// backdrop click. The pointerdown target is the inner control, not the
			// overlay, so the dismisser-driven close (Image Studio mounting) is ignored.
			await user.click( screen.getByTestId( 'inner-control' ) );
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

describe( 'Screen', () => {
	beforeEach( () => {
		mockGoBack.mockClear();
	} );

	it( 'calls onGoBack before navigating back when back button is clicked', async () => {
		const user = userEvent.setup();
		const onGoBack = jest.fn();

		render( <Screen path="/test" title="Test" onGoBack={ onGoBack } /> );

		await user.click( screen.getByLabelText( 'Go back' ) );

		expect( onGoBack ).toHaveBeenCalledTimes( 1 );
		expect( mockGoBack ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'navigates back without calling onGoBack when onGoBack is not provided', async () => {
		const user = userEvent.setup();

		render( <Screen path="/test" title="Test" /> );

		await user.click( screen.getByLabelText( 'Go back' ) );

		expect( mockGoBack ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not show back button when screen is locked', () => {
		render( <Screen path="/test" title="Test" isScreenLocked onGoBack={ jest.fn() } /> );

		expect( screen.queryByLabelText( 'Go back' ) ).not.toBeInTheDocument();
	} );

	it( 'calls onClose before closing the modal when close button is clicked', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		const contextOnClose = jest.fn();

		render(
			<NavigatorModalContext.Provider value={ { isDismissible: true, onClose: contextOnClose } }>
				<Screen path="/test" title="Test" onClose={ onClose } />
			</NavigatorModalContext.Provider>
		);

		await user.click( screen.getByLabelText( 'Close' ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( contextOnClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
