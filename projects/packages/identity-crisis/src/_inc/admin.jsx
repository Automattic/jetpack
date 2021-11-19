/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import React from 'react';
import { IDCScreen } from '@automattic/jetpack-idc';

/**
 * Internal dependencies
 */
import '../scss/jetpack-idc-admin-bar.scss';
import './style.scss';

/**
 * The initial renderer function.
 */
function render() {
	const container = document.getElementById( 'jp-identity-crisis-container' );

	if ( null === container || ! window.hasOwnProperty( 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return;
	}

	const {
		WP_API_root,
		WP_API_nonce,
		wpcomHomeUrl,
		currentUrl,
		redirectUri,
	} = window.JP_IDENTITY_CRISIS__INITIAL_STATE;

	ReactDOM.render(
		<IDCScreen
			wpcomHomeUrl={ wpcomHomeUrl }
			currentUrl={ currentUrl }
			apiRoot={ WP_API_root }
			apiNonce={ WP_API_nonce }
			redirectUri={ redirectUri }
		/>,
		container
	);
}

render();
