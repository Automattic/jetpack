import { Panel } from './PanelPage';

export class ConnectionManagementPageObject {
	constructor( container ) {
		this.container = container;
	}

	rerender() {
		this.container.rerender();
	}

	get header() {
		return this.container.getByText( 'My Connections' );
	}

	get addConnectionButton() {
		return this.container.getByRole( 'button', { name: 'Add connection' } );
	}

	get spinners() {
		return this.container.queryAllByRole( 'presentation', { name: 'Loading spinner' } );
	}

	getConnectionByName( name ) {
		return this.container.queryByText( name );
	}

	get connectionPanels() {
		return this.container.getAllByRole( 'listitem' ).map( panel => new Panel( panel ) );
	}
}
