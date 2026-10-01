/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { default: MarkAsSpamConfirmationModal } =
	await import( '../../../../../src/dashboard/components/mark-as-spam-confirmation-modal' );

const MESSAGE = 'Are you sure you want to mark this response as spam?';

const renderModal = ( onConfirm = jest.fn( async () => {} ) ) => {
	const onCancel = jest.fn();
	render(
		<MarkAsSpamConfirmationModal
			isOpen
			onCancel={ onCancel }
			onConfirm={ onConfirm }
			message={ MESSAGE }
		/>
	);
	return { onCancel, onConfirm };
};

describe( 'MarkAsSpamConfirmationModal', () => {
	it( 'uses the message as the dialog title and opens on Cancel', async () => {
		renderModal();

		await expect(
			screen.findByRole( 'alertdialog', { name: MESSAGE } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus();
	} );

	it( 'cancels on Escape', async () => {
		const { onCancel, onConfirm } = renderModal();

		await expect( screen.findByRole( 'alertdialog' ) ).resolves.toBeInTheDocument();
		await userEvent.keyboard( '{Escape}' );

		await waitFor( () => expect( onCancel ).toHaveBeenCalledTimes( 1 ) );
		expect( onConfirm ).not.toHaveBeenCalled();
	} );

	it( 'stays open when the confirm handler finishes without closing it', async () => {
		const { onCancel, onConfirm } = renderModal();

		await userEvent.click( await screen.findByRole( 'button', { name: 'OK' } ) );

		await waitFor( () => expect( onConfirm ).toHaveBeenCalledTimes( 1 ) );
		expect( onCancel ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
		await waitFor( () => expect( screen.getByRole( 'button', { name: 'OK' } ) ).toBeEnabled() );
	} );
} );
