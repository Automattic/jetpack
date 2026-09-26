import { IDCScreen } from '@automattic/jetpack-idc';
import * as WPElement from '@wordpress/element';

import './admin-bar.scss';
import './style.scss';

// How long to keep watching for a container a dashboard renders after `load`,
// before giving up.
const CONTAINER_WATCH_TIMEOUT = 30000;

let hasMounted = false;

/**
 * Mount the IDC screen into a container, once.
 *
 * @param {Element} container - Element to mount into.
 * @param {object}  state     - `window.JP_IDENTITY_CRISIS__INITIAL_STATE`.
 */
function mount( container, state ) {
	if ( hasMounted ) {
		return;
	}
	hasMounted = true;

	const {
		WP_API_root,
		WP_API_nonce,
		wpcomHomeUrl,
		currentUrl,
		redirectUri,
		tracksUserData,
		tracksEventData,
		consumerData,
		isAdmin,
		possibleDynamicSiteUrlDetected,
		isDevelopmentSite,
	} = state;

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

/**
 * Watch the DOM for a container that isn't there yet at `load` — a dashboard
 * using a custom `containerID` may still be mounting its own React tree.
 * Gives up after CONTAINER_WATCH_TIMEOUT rather than observing forever.
 *
 * @param {string} containerId - HTML id to watch for.
 * @param {object} state       - `window.JP_IDENTITY_CRISIS__INITIAL_STATE`.
 */
function waitForContainer( containerId, state ) {
	const observer = new MutationObserver( () => {
		const container = document.getElementById( containerId );
		if ( container ) {
			clearTimeout( timeoutId );
			observer.disconnect();
			mount( container, state );
		}
	} );

	const timeoutId = setTimeout( () => observer.disconnect(), CONTAINER_WATCH_TIMEOUT );

	observer.observe( document.body, { childList: true, subtree: true } );
}

/**
 * The initial renderer function.
 */
function render() {
	if ( ! Object.hasOwn( window, 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return;
	}

	const state = window.JP_IDENTITY_CRISIS__INITIAL_STATE;
	if ( state.isSafeModeConfirmed ) {
		return;
	}

	const containerId = state.containerID || 'jp-identity-crisis-container';
	const container = document.getElementById( containerId );

	if ( container ) {
		mount( container, state );
		return;
	}

	// The default container is printed server-side and exists at `load`; a
	// missing default means there's genuinely nothing to mount into.
	if ( state.containerID ) {
		waitForContainer( containerId, state );
	}
}

window.addEventListener( 'load', () => render() );

export { render };
