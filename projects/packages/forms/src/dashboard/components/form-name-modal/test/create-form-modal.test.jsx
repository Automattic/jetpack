import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateFormModal } from '../create-form-modal.tsx';

const setup = ( props = {} ) => {
	const onClose = jest.fn();
	const onSave = jest.fn( () => new Promise( () => {} ) );

	render( <CreateFormModal isOpen onClose={ onClose } onSave={ onSave } { ...props } /> );

	return { onClose, onSave };
};

describe( 'CreateFormModal', () => {
	it( 'renders the create copy every entry point shares', () => {
		setup();

		expect( screen.getByRole( 'dialog', { name: 'Create form' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Create' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Enter form title' ) ).toBeInTheDocument();
	} );

	it( 'hands the typed title to onSave and stays busy for the navigation', async () => {
		const user = userEvent.setup();
		const { onSave, onClose } = setup();

		await user.type( screen.getByRole( 'textbox' ), 'Contact' );
		await user.click( screen.getByRole( 'button', { name: 'Create' } ) );

		expect( onSave ).toHaveBeenCalledWith( 'Contact' );
		// onSave models a page handoff and never settles, so the dialog must not close itself.
		await expect( screen.findByText( 'Opening the editor…' ) ).resolves.toBeInTheDocument();
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'renders nothing when closed', () => {
		setup( { isOpen: false } );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );
} );
