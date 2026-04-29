import { createRoot } from '@wordpress/element';
import App from './components/app';
import './style.scss';

const container = document.getElementById( 'jetpack-subscribers-dashboard' );

if ( container ) {
	createRoot( container ).render( <App /> );
}
