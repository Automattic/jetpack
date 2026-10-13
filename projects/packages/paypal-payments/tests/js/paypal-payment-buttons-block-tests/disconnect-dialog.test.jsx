/**
 * Tests for the PayPal Connection panel's disconnect confirmation.
 *
 * @package
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialogs from '../../../src/paypal-payment-buttons/components/confirm-dialogs';

// wp.element re-exports React at runtime.
jest.mock( '@wordpress/element', () => ( {
	...require( 'react' ),
	createPortal: require( 'react-dom' ).createPortal,
} ) );

const noop = () => {};

const renderDisconnect = ( props = {} ) =>
	render(
		<ConfirmDialogs
			showDeleteConfirm={ false }
			setShowDeleteConfirm={ noop }
			showDisconnectConfirm={ true }
			setShowDisconnectConfirm={ noop }
			showLogOutConfirm={ false }
			setShowLogOutConfirm={ noop }
			executeDeleteButton={ noop }
			executeDisconnect={ noop }
			{ ...props }
		/>
	);

describe( 'Disconnect dialog', () => {
	it( 'leads with the sentence PayPal prescribes, then the site-wide notes', () => {
		renderDisconnect();

		const dialog = screen.getByRole( 'dialog', { name: 'Disconnect PayPal Account' } );
		expect(
			within( dialog ).getByText(
				'Disconnecting your PayPal account will prevent you from offering PayPal services and products on your website. Do you wish to continue?'
			)
		).toBeInTheDocument();

		expect(
			within( dialog )
				.getAllByRole( 'listitem' )
				.map( item => item.textContent )
		).toEqual( [
			'This disconnects PayPal for the whole site, not just this block.',
			'Every payment button on this site will need PayPal reconnected before it can be edited or deleted.',
			'Buttons you have already published keep working for buyers.',
		] );
	} );

	it( 'disconnects on confirm', async () => {
		const user = userEvent.setup();
		const executeDisconnect = jest.fn();
		renderDisconnect( { executeDisconnect } );

		await user.click( screen.getByRole( 'button', { name: 'Disconnect' } ) );
		expect( executeDisconnect ).toHaveBeenCalled();
	} );

	it( 'closes on cancel', async () => {
		const user = userEvent.setup();
		const executeDisconnect = jest.fn();
		const setShowDisconnectConfirm = jest.fn();
		renderDisconnect( { executeDisconnect, setShowDisconnectConfirm } );

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( setShowDisconnectConfirm ).toHaveBeenCalledWith( false );
		expect( executeDisconnect ).not.toHaveBeenCalled();
	} );
} );
