/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import JetpackDisconnectModal from './components/jetpack-termination-dialog/disconnect-modal';
import DisconnectModalStateHOC from './components/jetpack-termination-dialog/disconnect-modal-state-hoc';

/**
 * Helper for showing information when Jetpack is deactivated
 * idea for this structure from React docs: https://reactjs.org/blog/2015/10/01/react-render-and-top-level-api.html
 */
function PluginDeactivationHelper() {
	this.constructor = () => {
		this.container = document.getElementById( 'test_jetpack_deactivation_dialog' );
		this.modalOpen = false;
		this.disableLink = document.getElementById( 'jetpack-plugin-deactivate-link' );

		if ( ! this.container ) {
			return;
		}

		this.render();
		this.listen();
	};

	this.listen = () => {
		// pick up the click on the deactivation link to show the modal
		// TODO: need to also handle the keyboard events
		// TODO: need to also pick up the nonce from the link to complete deactivation in the modal context
		this.disableLink.addEventListener( 'click', this.handleLinkClick );

		// TODO: pick up the form submission for bulk deactivation - if jetpack is being deactivated, show a similar warning
		// maybe load some data attributes on the anchor that indicate if other plugins are using the Jetpack connection or not
		// this way we can know if the modal should show or not
	};

	this.handleLinkClick = e => {
		e.preventDefault();

		this.modalOpen = true;
		this.render();
	};

	this.toggleVisibility = () => {
		this.modalOpen = ! this.modalOpen;
		this.render();
	};

	this.render = () => {
		// TODO: state HOC component only serves to configure the rest API - this may be refactorable to use a hook
		ReactDOM.render(
			<Provider store={ store }>
				<DisconnectModalStateHOC>
					<JetpackDisconnectModal
						show={ this.modalOpen }
						showSurvey={ false }
						toggleModal={ this.toggleVisibility }
					/>
				</DisconnectModalStateHOC>
			</Provider>,
			this.container
		);
	};
}

// this seems a bit silly
// eslint prefers assigning and using a variable over setting up PluginDeactivationHelper as a class and calling new with no assignment
const jetpack_deactivation_helper = new PluginDeactivationHelper();

if ( document.readyState !== 'loading' ) {
	jetpack_deactivation_helper.constructor();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		jetpack_deactivation_helper.constructor();
	} );
}
