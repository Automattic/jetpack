import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export class Panel {
	constructor( container ) {
		this.container = container;
	}

	get body() {
		return this.container.firstChild;
	}

	get disconnectButton() {
		return within( this.container ).queryByRole( 'button', { name: 'Disconnect' } );
	}

	get closeButton() {
		return within( this.container ).getByRole( 'button', { name: 'Close panel' } );
	}

	get openButton() {
		return within( this.container ).getByRole( 'button', { name: 'Open panel' } );
	}

	get markAsSharedToggle() {
		return within( this.container ).queryByRole( 'checkbox', {
			name: 'Mark the connection as shared',
		} );
	}

	isOpen() {
		return this.container.querySelector( '.is-opened' ) !== null;
	}

	async open() {
		await userEvent.click( this.openButton );
	}

	async close() {
		await userEvent.click( this.closeButton );
	}

	async disconnect() {
		await userEvent.click( this.disconnectButton );
	}

	async disconnectFully() {
		await this.disconnect();
		await userEvent.click( screen.getByRole( 'button', { name: 'Yes' } ) );
	}

	async toggleMarkAsShared() {
		await userEvent.click( this.markAsSharedToggle );
	}
}
