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

	getConnectionByName( name ) {
		return this.container.queryByText( name );
	}

	get connectionPanels() {
		return this.container.getAllByRole( 'listitem' ).map( panel => new Panel( panel ) );
	}
}
