import { IDCScreen } from '@automattic/jetpack-idc';
import * as WPElement from '@wordpress/element';
import React from 'react';

import './admin-bar.scss';
import './style.scss';

/**
 * The initial renderer function.
 */
function render() {
	if ( ! window.hasOwnProperty( 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return;
	}

	const container = document.getElementById(
		window.JP_IDENTITY_CRISIS__INITIAL_STATE.containerID || 'jp-identity-crisis-container'
	);

	if ( null === container ) {
		return;
	}

	const {
		WP_API_root,
		WP_API_nonce,
		wpcomHomeUrl,
		currentUrl,
		redirectUri,
		tracksUserData,
		tracksEventData,
		isSafeModeConfirmed,
		consumerData,
		isAdmin,
		possibleDynamicSiteUrlDetected,
		isDevelopmentSite,
	} = window.JP_IDENTITY_CRISIS__INITIAL_STATE;

	if ( ! isSafeModeConfirmed ) {
		const component = (
			<IDCScreen
				wpcomHomeUrl={ wpcomHomeUrl }
				currentUrl={ currentUrl }
				apiRoot={ WP_API_root }
				apiNonce={ WP_API_nonce }
				redirectUri={ redirectUri }
				tracksUserData={ tracksUserData || {} }
				tracksEventData={ tracksEventData }
				customContent={
					consumerData.hasOwnProperty( 'customContent' ) ? consumerData.customContent : {}
				}
				isAdmin={ isAdmin }
				logo={ consumerData.hasOwnProperty( 'logo' ) ? consumerData.logo : undefined }
				possibleDynamicSiteUrlDetected={ possibleDynamicSiteUrlDetected }
				isDevelopmentSite={ isDevelopmentSite }
			/>
		);
		WPElement.createRoot( container ).render( component );
	}
}

window.addEventListener( 'load', () => render() );
