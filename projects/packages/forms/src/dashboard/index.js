import { render } from '@wordpress/element';
import Inbox from './inbox';

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	render( <Inbox />, container );
} );
