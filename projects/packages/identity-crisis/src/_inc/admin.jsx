import { IDCScreen } from '@automattic/jetpack-idc';
import React from 'react';
import ReactDOM from 'react-dom';

import './admin-bar.scss';
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
		tracksUserData,
		tracksEventData,
		isSafeModeConfirmed,
		consumerData,
		isAdmin,
		possibleDynamicSiteUrlDetected,
	} = window.JP_IDENTITY_CRISIS__INITIAL_STATE;

	if ( ! isSafeModeConfirmed ) {
		ReactDOM.render(
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
			/>,
			container
		);
	}
}

render();
