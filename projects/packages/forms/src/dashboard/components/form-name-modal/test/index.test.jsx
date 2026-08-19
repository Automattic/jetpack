import { describe, expect, it, jest } from '@jest/globals';
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
	it( 'can still be dismissed while a navigating save is in flight', async () => {
		const user = userEvent.setup();
		const { onClose } = setup( {
			onSave: jest.fn( () => new Promise( () => {} ) ),
			busyMessage: 'Opening the editor…',
		} );

		await user.click( createButton() );
		await expect( screen.findByText( 'Opening the editor…' ) ).resolves.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalled();
	} );

	it( 'tells the user when saving failed', async () => {
		const user = userEvent.setup();
		setup( {
			onSave: jest.fn().mockRejectedValue( new Error( 'nope' ) ),
			errorMessage: 'Could not create the form. Please try again.',
		} );

		await user.click( createButton() );

		await expect(
			screen.findByText( 'Could not create the form. Please try again.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'clears the failure once the user edits the name again', async () => {
		const user = userEvent.setup();
		setup( {
			onSave: jest.fn().mockRejectedValue( new Error( 'nope' ) ),
			errorMessage: 'Could not create the form. Please try again.',
		} );

		await user.click( createButton() );
		await expect(
			screen.findByText( 'Could not create the form. Please try again.' )
		).resolves.toBeInTheDocument();

		await user.type( screen.getByRole( 'textbox' ), 'x' );

		expect(
			screen.queryByText( 'Could not create the form. Please try again.' )
		).not.toBeInTheDocument();
	} );

	it( 'stays open and busy after a save that navigates away', async () => {
		const user = userEvent.setup();
		// A save that hands off to a page load never settles — there is no "done" to report.
		const { onClose } = setup( {
			onSave: jest.fn( () => new Promise( () => {} ) ),
			busyMessage: 'Opening the editor…',
		} );

		await user.click( createButton() );

		await expect( screen.findByText( 'Opening the editor…' ) ).resolves.toBeInTheDocument();
		expect( createButton() ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'closes once the save resolves', async () => {
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
