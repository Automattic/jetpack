import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionDialog, { ConnectionDialogTitle } from '../index';

describe( 'ConnectionDialog', () => {
	const onClose = jest.fn();

	afterEach( () => {
		onClose.mockClear();
	} );

	it( 'renders nothing when closed', () => {
		render(
			<ConnectionDialog isOpen={ false } onClose={ onClose } title="Test dialog">
				Body
			</ConnectionDialog>
		);
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the dialog with the given title when open', () => {
		render(
			<ConnectionDialog isOpen onClose={ onClose } title="Test dialog">
				Body
			</ConnectionDialog>
		);
		expect( screen.getByRole( 'dialog', { name: 'Test dialog' } ) ).toBeInTheDocument();
	} );

	it( 'uses ConnectionDialogTitle as the accessible name when hasOwnTitle is set', () => {
		render(
			<ConnectionDialog isOpen onClose={ onClose } hasOwnTitle>
				<ConnectionDialogTitle>Own title</ConnectionDialogTitle>
				Body
			</ConnectionDialog>
		);
		expect( screen.getByRole( 'dialog', { name: 'Own title' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 1, name: 'Own title' } ) ).toBeInTheDocument();
	} );

	it( 'ignores Escape by default, and does not call onClose', async () => {
		const user = userEvent.setup();
		render(
			<ConnectionDialog isOpen onClose={ onClose } title="Test dialog">
				Body
			</ConnectionDialog>
		);
		await user.keyboard( '{Escape}' );
		expect( onClose ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );

	it( 'calls onClose on Escape when dismissOnEscape is true', async () => {
		const user = userEvent.setup();
		render(
			<ConnectionDialog isOpen onClose={ onClose } title="Test dialog" dismissOnEscape>
				Body
			</ConnectionDialog>
		);
		await user.keyboard( '{Escape}' );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not call onClose when the backdrop is clicked', async () => {
		const user = userEvent.setup();
		const { container } = render(
			<ConnectionDialog isOpen onClose={ onClose } title="Test dialog">
				Body
			</ConnectionDialog>
		);
		// The backdrop is the portalled sibling preceding the popup; clicking
		// outside the popup content should not dismiss (disablePointerDismissal).
		await user.click( container.ownerDocument.body );
		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
