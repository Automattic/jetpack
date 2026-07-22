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

	/*
	 * WPDS `Collapsible` exposes a single trigger that both opens and closes,
	 * labelled per connection ("Toggle details for <account> on <network>"),
	 * where the legacy `PanelBody` had separate "Open panel"/"Close panel"
	 * buttons. `open()`/`close()` below keep the old two-verb API.
	 */
	get toggleButton() {
		return within( this.container ).getByRole( 'button', { name: /^Toggle details for/ } );
	}

	get markAsSharedToggle() {
		return within( this.container ).queryByRole( 'checkbox', {
			name: 'Mark the connection as shared',
		} );
	}

	isOpen() {
		// Base UI stamps `data-panel-open` on the trigger while the disclosure
		// is expanded; the legacy panel used an `.is-opened` class.
		return this.container.querySelector( '[data-panel-open]' ) !== null;
	}

	async open() {
		await userEvent.click( this.toggleButton );
	}

	async close() {
		await userEvent.click( this.toggleButton );
	}

	async disconnect() {
		await userEvent.click( this.disconnectButton );
	}

	async disconnectFully() {
		await this.disconnect();
		await userEvent.click( screen.getByRole( 'button', { name: 'Yes' } ) );
	}

	async cancelDisconnect() {
		await this.disconnect();
		await userEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
	}

	async toggleMarkAsShared() {
		await userEvent.click( this.markAsSharedToggle );
	}
}
