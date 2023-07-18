import * as WPElement from '@wordpress/element';
import React from 'react';
import ChatForm from './components/chatform';

/**
 * Initial render function.
 */
function render() {
	const container = document.getElementById( 'jetpack-odysseus-root' );

	if ( null === container ) {
		return;
	}

	// @todo: Remove fallback when we drop support for WP 6.1
	const component = <ChatForm />;

	if ( WPElement.createRoot ) {
		WPElement.createRoot( container ).render( component );
	} else {
		WPElement.render( component, container );
	}
}

render();
