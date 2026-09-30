/**
 * Tests for the account menu's log-out confirmation.
 *
 * The copy comes from the design, down to the curly apostrophe, so it is
 * asserted here rather than left to a reviewer's eye.
 *
 * @package
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogOutDialog } from '../../../src/paypal-payment-buttons/components/confirm-dialogs';

// wp.element re-exports React at runtime.
jest.mock( '@wordpress/element', () => ( {
	...require( 'react' ),
	createPortal: require( 'react-dom' ).createPortal,
} ) );

const noop = () => {};

describe( 'LogOutDialog', () => {
	it( 'renders the design copy, curly apostrophe and all', () => {
		render( <LogOutDialog onConfirm={ noop } onCancel={ noop } /> );

		expect( screen.getByRole( 'dialog', { name: 'Log out from PayPal' } ) ).toBeInTheDocument();
		expect(
			screen.getByText(
				'You won’t be able to add, edit, or view payment buttons while using WordPress after you log out of PayPal.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Log out' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toBeInTheDocument();
	} );

	it( 'renders the heading, the close button and the two buttons in their design styles', () => {
		render( <LogOutDialog onConfirm={ noop } onCancel={ noop } /> );

		const dialog = screen.getByRole( 'dialog', { name: 'Log out from PayPal' } );
		expect(
			within( dialog ).getByRole( 'heading', { name: 'Log out from PayPal' } )
		).toBeInTheDocument();
		expect( within( dialog ).getByRole( 'button', { name: 'Close' } ) ).toBeVisible();

		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveClass( 'is-tertiary' );

		// Primary blue, rather than the red of a destructive confirm.
		const confirm = screen.getByRole( 'button', { name: 'Log out' } );
		expect( confirm ).toHaveClass( 'is-primary' );
		expect( confirm ).not.toHaveClass( 'is-destructive' );
	} );

	it( 'confirms on Log out and backs out on Cancel', async () => {
		const user = userEvent.setup();
		const onConfirm = jest.fn();
		const onCancel = jest.fn();
		render( <LogOutDialog onConfirm={ onConfirm } onCancel={ onCancel } /> );

		await user.click( screen.getByRole( 'button', { name: 'Log out' } ) );
		expect( onConfirm ).toHaveBeenCalled();
		expect( onCancel ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( onCancel ).toHaveBeenCalled();
	} );
} );
