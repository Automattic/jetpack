import { render } from '@wordpress/element';
import React from 'react';
import { Provider } from 'react-redux';
import store from 'state/redux-store-minimal';
import ActivationModal from './portals/activation-modal';

/**
 * Mount the app to the app node that we include in the footer.
 */
function initActivationModalApp() {
	const container = document.getElementById( 'jetpack-plugin-portal-app' );

	render(
		<Provider store={ store }>
			<ActivationModal />
		</Provider>,
		container
	);
}

if ( document.readyState !== 'loading' ) {
	initActivationModalApp();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		initActivationModalApp();
	} );
}
