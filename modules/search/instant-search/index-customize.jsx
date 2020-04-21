/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import CustomizeApp from './components/customize-app';

document.addEventListener( 'DOMContentLoaded', function() {
	render(
		<CustomizeApp
			apiRoot={ window.JetpackInstantCustomizeOptions.apiRoot }
			apiNonce={ window.JetpackInstantCustomizeOptions.apiNonce }
		/>,
		document.body
	);
} );
