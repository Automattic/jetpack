import { IDCScreen } from '@automattic/jetpack-idc';
import * as WPElement from '@wordpress/element';

import './admin-bar.scss';
import './style.scss';

/**
 * The initial renderer function.
 */
function render() {
	if ( ! Object.hasOwn( window, 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return;
	}

	const { containerID, isSafeModeConfirmed } = window.JP_IDENTITY_CRISIS__INITIAL_STATE;
	const container = document.getElementById( containerID || 'jp-identity-crisis-container' );

	if ( null === container ) {
		// The server prints the default container, so only a custom one can still appear.
		if ( containerID && ! isSafeModeConfirmed ) {
			waitForContainer( containerID );
		}
		return;
	}

	renderInto( container );
}

/**
 * Render the Safe Mode screen once a container that is added after page load appears.
 *
 * My Jetpack's dashboard adds its container shortly after page load.
 * Stop after a minute, well past a slow dashboard's start, so a page that never adds the container is not watched for every change.
 *
 * @param {string} containerId - ID of the container element.
 */
function waitForContainer( containerId ) {
	let timeout = null;
	const observer = new MutationObserver( () => {
		const container = document.getElementById( containerId );
		if ( null === container ) {
			return;
		}
		// Rendering changes the page, so without this the observer renders over and over.
		observer.disconnect();
		clearTimeout( timeout );
		renderInto( container );
	} );
	observer.observe( document.body, { childList: true, subtree: true } );
	timeout = setTimeout( () => observer.disconnect(), 60 * 1000 );
}

/**
 * Render the Safe Mode screen into its container.
 *
 * @param {HTMLElement} container - The container element.
 */
function renderInto( container ) {
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
					Object.hasOwn( consumerData, 'customContent' ) ? consumerData.customContent : {}
				}
				isAdmin={ isAdmin }
				logo={ Object.hasOwn( consumerData, 'logo' ) ? consumerData.logo : undefined }
				possibleDynamicSiteUrlDetected={ possibleDynamicSiteUrlDetected }
				isDevelopmentSite={ isDevelopmentSite }
			/>
		);
		WPElement.createRoot( container ).render( component );
	}
}

window.addEventListener( 'load', () => render() );
