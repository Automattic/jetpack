/**
 * External dependencies
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { MarkAsSpamButton } from '../mark-as-spam-button';

describe( 'MarkAsSpamButton', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'marks the domain only after the reader confirms', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const onConfirm = jest.fn().mockResolvedValue( undefined );

		render( <MarkAsSpamButton domain="spam.example" onConfirm={ onConfirm } /> );

		await user.click( screen.getByRole( 'button', { name: 'Mark "spam.example" as spam' } ) );

		const dialog = await screen.findByRole( 'alertdialog', { name: 'Mark as spam' } );
		expect( dialog ).toHaveTextContent( 'Are you sure you want to mark "spam.example" as spam?' );
		expect( onConfirm ).not.toHaveBeenCalled();

		await user.click( within( dialog ).getByRole( 'button', { name: 'Mark as spam' } ) );

		expect( onConfirm ).toHaveBeenCalledWith( 'spam.example' );
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
	} );
} );
