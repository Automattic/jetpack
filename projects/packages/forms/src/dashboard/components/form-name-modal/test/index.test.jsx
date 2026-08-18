import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormNameModal } from '../index.tsx';

const setup = ( props = {} ) => {
	const onClose = jest.fn();
	const onSave = jest.fn().mockResolvedValue( undefined );

	render(
		<FormNameModal
			isOpen
			onClose={ onClose }
			onSave={ onSave }
			title="Create form"
			primaryButtonLabel="Create"
			secondaryButtonLabel="Cancel"
			{ ...props }
		/>
	);

	return { onClose, onSave };
};

const createButton = () => screen.getByRole( 'button', { name: 'Create' } );

describe( 'FormNameModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'signals the first edit exactly once', async () => {
		const user = userEvent.setup();
		const onFirstEdit = jest.fn();
		setup( { onFirstEdit } );

		await user.type( screen.getByRole( 'textbox' ), 'Contact' );

		expect( onFirstEdit ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not signal an edit before the user types', () => {
		const onFirstEdit = jest.fn();
		setup( { onFirstEdit, initialValue: 'Existing name' } );

		expect( onFirstEdit ).not.toHaveBeenCalled();
	} );

	it( 'stays open and busy after a save that navigates away', async () => {
		const user = userEvent.setup();
		const { onClose } = setup( {
			closeOnSave: false,
			busyMessage: 'Opening the editor…',
		} );

		await user.click( createButton() );

		await expect( screen.findByText( 'Opening the editor…' ) ).resolves.toBeInTheDocument();
		expect( createButton() ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'closes after a save when asked to', async () => {
		const user = userEvent.setup();
		const { onClose } = setup();

		await user.click( createButton() );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
	} );

	it( 'clears the busy state when the save fails, so the user can retry', async () => {
		const user = userEvent.setup();
		const onSave = jest.fn().mockRejectedValue( new Error( 'nope' ) );
		const { onClose } = setup( {
			onSave,
			closeOnSave: false,
			busyMessage: 'Opening the editor…',
		} );

		await user.click( createButton() );

		await waitFor( () => expect( createButton() ).toHaveAttribute( 'aria-disabled', 'false' ) );
		expect( screen.queryByText( 'Opening the editor…' ) ).not.toBeInTheDocument();
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'falls back to a default name when nothing is typed', async () => {
		const user = userEvent.setup();
		const { onSave } = setup( { fallbackName: 'Untitled Form' } );

		await user.click( createButton() );

		expect( onSave ).toHaveBeenCalledWith( 'Untitled Form' );
	} );
} );
