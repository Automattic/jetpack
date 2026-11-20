/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { default: EmptyTrashConfirmationModal } =
	await import( '../../../../../src/dashboard/components/empty-trash-button/confirmation-modal' );

const renderModal = () => {
	const onCancel = jest.fn();
	const onConfirm = jest.fn();
	render(
		<EmptyTrashConfirmationModal
			isOpen
			onCancel={ onCancel }
			onConfirm={ onConfirm }
			totalItemsTrash={ 3 }
			selectedResponsesCount={ 0 }
		/>
	);
	return { onCancel, onConfirm };
};

describe( 'EmptyTrashConfirmationModal', () => {
	it( 'confirms without calling onCancel', async () => {
		const { onCancel, onConfirm } = renderModal();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Delete' } ) );

		await waitFor( () => expect( onConfirm ).toHaveBeenCalledTimes( 1 ) );
		expect( onCancel ).not.toHaveBeenCalled();
	} );

	it( 'calls onCancel on Escape', async () => {
		const { onCancel, onConfirm } = renderModal();

		await expect( screen.findByRole( 'alertdialog' ) ).resolves.toBeInTheDocument();
		await userEvent.keyboard( '{Escape}' );

		await waitFor( () => expect( onCancel ).toHaveBeenCalledTimes( 1 ) );
		expect( onConfirm ).not.toHaveBeenCalled();
	} );
} );
