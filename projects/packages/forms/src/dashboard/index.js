import { render } from '@wordpress/element';
import Inbox from './inbox';
import './style.scss';

window.addEventListener( 'load', () => {
	const container = document.getElementById( 'jp-forms-dashboard' );

	render( <Inbox />, container );
} );
