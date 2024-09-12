import { getByRole, queryByRole, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export class Panel {
	constructor( container ) {
		this.container = container;
	}

	get body() {
		return this.container.firstChild;
	}

	get disconnectButton() {
		return queryByRole( this.container, 'button', { name: 'Disconnect' } );
	}

	get closeButton() {
		return getByRole( this.container, 'button', { name: 'Close panel' } );
	}

	get openButton() {
		return getByRole( this.container, 'button', { name: 'Open panel' } );
	}

	get markAsSharedToggle() {
		return queryByRole( this.container, 'checkbox', { name: 'Mark the connection as shared' } );
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
