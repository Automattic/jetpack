import { createRoot } from '@wordpress/element';
import { App } from '@/app';

const root = document.getElementById( 'akismet-experimental-app' );
if ( root ) {
	createRoot( root ).render( <App /> );
}
