import { createRoot } from '@wordpress/element';
import AdminApp from './components/AdminApp';

const container = document.getElementById( 'jetpack-ai-poc-root' );

if ( container ) {
	const root = createRoot( container );
	root.render( <AdminApp /> );
}
