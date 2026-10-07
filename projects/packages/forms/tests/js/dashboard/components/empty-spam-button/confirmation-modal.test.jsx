/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { default: EmptySpamConfirmationModal } =
	await import( '../../../../../src/dashboard/components/empty-spam-button/confirmation-modal' );

const renderModal = () => {
	const onCancel = jest.fn();
	const onConfirm = jest.fn();
	render(
		<EmptySpamConfirmationModal
			isOpen
			onCancel={ onCancel }
			onConfirm={ onConfirm }
			scopeMode="all"
			count={ 3 }
		/>
	);
	return { onCancel, onConfirm };
};

describe( 'EmptySpamConfirmationModal', () => {
	it( 'confirms without calling onCancel', async () => {
		const { onCancel, onConfirm } = renderModal();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Delete forever' } ) );

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

	it.each( [
		[ 'selection', 3, 'Delete 3 selected spam responses?' ],
		[ 'filtered', 26, 'Delete 26 matching spam responses?' ],
		[ 'all', 1, 'Delete 1 spam response?' ],
	] )( 'titles the %s scope with its count', async ( scopeMode, count, title ) => {
		render(
			<EmptySpamConfirmationModal
				isOpen
				onCancel={ jest.fn() }
				onConfirm={ jest.fn() }
				scopeMode={ scopeMode }
				count={ count }
			/>
		);

		await expect(
			screen.findByRole( 'alertdialog', { name: title } )
		).resolves.toBeInTheDocument();
	} );
} );
