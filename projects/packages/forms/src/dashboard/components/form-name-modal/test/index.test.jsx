import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormNameModal } from '../index.tsx';

const BUSY = 'Opening the editor…';
const ERROR = 'Could not create the form. Please try again.';

// A save that hands off to a page load never settles — there is no "done" to report.
const navigatingSave = { onSave: jest.fn( () => new Promise( () => {} ) ), busyMessage: BUSY };
const failingSave = {
	onSave: jest.fn().mockRejectedValue( new Error( 'nope' ) ),
	busyMessage: BUSY,
	errorMessage: ERROR,
};

const setup = ( props = {} ) => {
	const onClose = jest.fn();
	const onSave = jest.fn().mockResolvedValue( undefined );
	const ui = isOpen => (
		<FormNameModal
			isOpen={ isOpen }
			onClose={ onClose }
			onSave={ onSave }
			title="Create form"
			primaryButtonLabel="Create"
			secondaryButtonLabel="Cancel"
			{ ...props }
		/>
	);

	const view = render( ui( true ) );

	return { onClose, onSave, rerender: isOpen => view.rerender( ui( isOpen ) ) };
};

const createButton = () => screen.getByRole( 'button', { name: 'Create' } );

// Notice.Root announces through @wordpress/a11y's speak(), which mirrors the text into a global
// live region outside the dialog. Scope assertions to the dialog so they see only what is rendered.
const inDialog = () => within( screen.getByRole( 'dialog' ) );

describe( 'FormNameModal', () => {
	it( 'stays open, busy and dismissable while a navigating save is in flight', async () => {
		const user = userEvent.setup();
		const { onClose } = setup( navigatingSave );

		await user.click( createButton() );

		await expect( screen.findByText( BUSY ) ).resolves.toBeInTheDocument();
		expect( createButton() ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( onClose ).not.toHaveBeenCalled();

		// A navigation that never starts must not trap the user in the dialog.
		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		expect( onClose ).toHaveBeenCalled();
	} );

	it( 'leaves the busy field read-only rather than disabled, so focus stays in the dialog', async () => {
		const user = userEvent.setup();
		setup( navigatingSave );

		// Submitting from the field leaves focus in it. Disabling it here would eject focus to the
		// document body, outside the dialog, where Modal's key handler never sees Escape. The Escape
		// consequence itself is not assertable — @wordpress/components Modal does not respond to
		// Escape under jsdom even when idle — so this pins the cause instead.
		await user.type( screen.getByRole( 'textbox' ), 'Contact{Enter}' );

		await expect( screen.findByText( BUSY ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'textbox' ) ).toHaveAttribute( 'readonly' );
		expect( screen.getByRole( 'textbox' ) ).toBeEnabled();
	} );

	it( 'reopens idle after being dismissed mid-navigation', async () => {
		const user = userEvent.setup();
		const { rerender } = setup( navigatingSave );

		await user.click( createButton() );
		await expect( screen.findByText( BUSY ) ).resolves.toBeInTheDocument();

		// Callers that keep the modal mounted while closed must not resurrect the busy state.
		rerender( false );
		rerender( true );

		expect( createButton() ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( screen.queryByText( BUSY ) ).not.toBeInTheDocument();
	} );

	it( 'clears the busy state and explains the failure when the save rejects', async () => {
		const user = userEvent.setup();
		const { onClose } = setup( failingSave );

		await user.click( createButton() );

		await waitFor( () => expect( inDialog().getByText( ERROR ) ).toBeInTheDocument() );
		await waitFor( () => expect( createButton() ).toHaveAttribute( 'aria-disabled', 'false' ) );
		expect( screen.queryByText( BUSY ) ).not.toBeInTheDocument();
		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'clears the failure once the user edits the name again', async () => {
		const user = userEvent.setup();
		setup( failingSave );

		await user.click( createButton() );
		await waitFor( () => expect( inDialog().getByText( ERROR ) ).toBeInTheDocument() );

		await user.type( screen.getByRole( 'textbox' ), 'x' );

		expect( inDialog().queryByText( ERROR ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to a default name when nothing is typed', async () => {
		const user = userEvent.setup();
		const { onSave } = setup( { fallbackName: 'Untitled Form' } );

		await user.click( createButton() );

		expect( onSave ).toHaveBeenCalledWith( 'Untitled Form' );
	} );

	it( 'closes itself when the save resolves', async () => {
		const user = userEvent.setup();
		// The contract callers rely on: onSave must not close the dialog, the dialog closes on resolve.
		const { onClose } = setup();

		await user.click( createButton() );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
	} );
} );
