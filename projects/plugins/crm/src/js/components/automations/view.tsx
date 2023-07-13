import * as WPElement from '@wordpress/element';
/**
 * Render function
 */
const render = () => {
	const container = document.getElementById( 'jetpack-crm-automations-root' );

	if ( null === container ) {
		return;
	}

	const component = <div>Hello, world!</div>;

	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
};

render();
