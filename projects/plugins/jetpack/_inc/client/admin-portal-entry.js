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
import SetAPIFromState from './portals/utilities/set-api-from-state';
import PluginDeactivationPortal from './portals/portal-plugin-deactivation';

/**
 * Match against the current page to know when to mount different portal subcomponents
 *
 * @param {object} props - the props
 * @returns {null|*} - child components or null
 */
const PageRoute = props => {
	const { path } = props;
	const page_path = window.location.pathname; // get the page path from here

	const slashTrim = string => {
		return string.replace( /^\/+/g, '' ).replace( /\/+$/g, '' );
	};

	const pathMatches = path_to_check => {
		// drop extra slashes
		return slashTrim( path_to_check ) === slashTrim( page_path );
	};

	if ( pathMatches( path ) ) {
		return props.children;
	}

	return null;
};

/**
 * Mount the app to the app node that we include in the footer
 */
function initPortalApp() {
	const container = document.getElementById( 'jetpack-plugin-portal-app' );

	// vary output based on current page location
	ReactDOM.render(
		<Provider store={ store }>
			<SetAPIFromState />
			<PageRoute path="wp-admin/plugins.php">
				<PluginDeactivationPortal />
			</PageRoute>
		</Provider>,
		container
	);
}

if ( document.readyState !== 'loading' ) {
	initPortalApp();
} else {
	document.addEventListener( 'DOMContentLoaded', () => {
		initPortalApp();
	} );
}
