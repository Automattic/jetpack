import { Panel } from './PanelPage';

export class ConnectionManagementPageObject {
	constructor( container ) {
		this.container = container;
	}

	rerender() {
		this.container.rerender();
	}

	get header() {
		return this.container.queryByText( 'Connected accounts' );
	}

	get addConnectionButton() {
		return this.container.getByRole( 'button', { name: 'Connect an account' } );
	}

	get spinners() {
		return this.container.queryAllByRole( 'presentation', { name: 'Loading account details' } );
	}

	/*
	 * The WPDS row renders the account name and the network label as separate
	 * text nodes, and the fixtures reuse one string for both ("Facebook" on
	 * Facebook), so a bare text query matches twice. The disclosure toggle's
	 * accessible name is the row's unique, user-facing identity.
	 */
	getConnectionByName( name ) {
		return this.container.queryByRole( 'button', {
			name: new RegExp( `^Toggle details for ${ name } on ` ),
		} );
	}

	get connectionPanels() {
		return this.container.getAllByRole( 'listitem' ).map( panel => new Panel( panel ) );
	}
}
