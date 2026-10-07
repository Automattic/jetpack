/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { default: DeleteFormConfirmationModal } =
	await import( '../../../../../src/dashboard/components/delete-form-confirmation-modal' );

const renderModal = ( props = {} ) => {
	const onCancel = jest.fn();
	const onConfirm = jest.fn();
	render(
		<DeleteFormConfirmationModal
			isOpen
			onCancel={ onCancel }
			onConfirm={ onConfirm }
			{ ...props }
		/>
	);
	return { onCancel, onConfirm };
};

describe( 'DeleteFormConfirmationModal', () => {
	it( 'describes a single form by default', async () => {
		renderModal();

		const dialog = await screen.findByRole( 'alertdialog', { name: 'Delete permanently' } );
		expect( dialog ).toHaveTextContent( 'This will permanently delete this form.' );
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus();
	} );

	it( 'describes several forms', async () => {
		renderModal( { count: 3 } );

		await expect( screen.findByRole( 'alertdialog' ) ).resolves.toHaveTextContent(
			'This will permanently delete 3 forms.'
		);
	} );

	it( 'cancels instead of confirming when Enter is pressed on open', async () => {
		const { onCancel, onConfirm } = renderModal();

		await expect( screen.findByRole( 'alertdialog' ) ).resolves.toBeInTheDocument();
		await userEvent.keyboard( '{Enter}' );

		await waitFor( () => expect( onCancel ).toHaveBeenCalledTimes( 1 ) );
		expect( onConfirm ).not.toHaveBeenCalled();
	} );

	it( 'confirms without calling onCancel', async () => {
		const { onCancel, onConfirm } = renderModal();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Delete permanently' } ) );

		await waitFor( () => expect( onConfirm ).toHaveBeenCalledTimes( 1 ) );
		expect( onCancel ).not.toHaveBeenCalled();
	} );
} );
