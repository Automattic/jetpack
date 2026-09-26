import { IDCScreen } from '@automattic/jetpack-idc';
import { Modal } from '@wordpress/components';
import * as WPElement from '@wordpress/element';

import './admin-bar.scss';
import './style.scss';

/**
 * Whether an element renders no layout box, e.g. hidden by `display: none`
 * on itself or an ancestor. `getClientRects()` returns an empty list in that
 * case; unlike `offsetParent`, it isn't also null for `position: fixed` elements.
 *
 * @param {Element} element - The element to check.
 * @return {boolean} Whether the element is hidden.
 */
function isHidden( element ) {
	return element.getClientRects().length === 0;
}

/**
 * Render the IDC screen inside a Modal appended to `document.body`, for pages
 * that hide the default container. Mirrors My Jetpack's own IDCModal.
 *
 * @param {import('react').ReactElement} screen - The IDCScreen element.
 */
function renderInModal( screen ) {
	const modalRoot = document.createElement( 'div' );
	document.body.appendChild( modalRoot );
	const root = WPElement.createRoot( modalRoot );
	const closeModal = () => root.unmount();

	// eslint-disable-next-line react/jsx-no-bind -- One-off imperative render, not a re-rendering component.
	root.render( <Modal onRequestClose={ closeModal }>{ screen }</Modal> );
}

/**
 * The initial renderer function.
 */
function render() {
	if ( ! Object.hasOwn( window, 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return;
	}

	const { containerID } = window.JP_IDENTITY_CRISIS__INITIAL_STATE;
	const container = document.getElementById( containerID || 'jp-identity-crisis-container' );

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

	if ( isSafeModeConfirmed ) {
		return;
	}

	const screen = (
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

	// A custom containerID (e.g. My Jetpack's own modal) always renders inline. The
	// default container falls back to a modal on pages that hide it via CSS.
	if ( containerID || ! isHidden( container ) ) {
		WPElement.createRoot( container ).render( screen );
		return;
	}

	renderInModal( screen );
}

window.addEventListener( 'load', () => render() );
