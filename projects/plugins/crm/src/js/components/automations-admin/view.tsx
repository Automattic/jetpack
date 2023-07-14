import * as WPElement from '@wordpress/element';
import { AutomationsAdmin } from '.';

/**
 * Render function
 */
const render = () => {
	const container = document.getElementById( 'jetpack-crm-automations-root' );

	if ( null === container ) {
		return;
	}

	const component = <AutomationsAdmin />;

	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
};

render();
