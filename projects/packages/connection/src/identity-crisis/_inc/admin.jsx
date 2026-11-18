import {
	CONNECTION_FROM,
	CONNECTION_STORE_ID,
	IdentityCrisis,
} from '@automattic/jetpack-connection';
import { IDCScreen } from '@automattic/jetpack-idc';
import { select } from '@wordpress/data';
import * as WPElement from '@wordpress/element';
import { goTo, reloadPage } from './navigate';

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

	renderInto( container, ! containerID );
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
		renderInto( container, false );
	} );
	observer.observe( document.body, { childList: true, subtree: true } );
	timeout = setTimeout( () => observer.disconnect(), 60 * 1000 );
}

/**
 * Whether the `connection-idc-screen` flag is on and the shared connection script has the new screen.
 *
 * @return {boolean} Whether to show the new screen.
 */
function shouldUseNewScreen() {
	// An older connection package can supply a shared script without the screen, or a state without `identityCrisis`.
	return (
		typeof IdentityCrisis === 'function' &&
		true === select( CONNECTION_STORE_ID )?.getIdentityCrisis?.()?.useNewScreen
	);
}

/**
 * What the notice does after a Safe Mode action succeeds.
 *
 * @param {object} result            - The action's result.
 * @param {string} result.action     - The action.
 * @param {string} result.connectUrl - Where a fresh connection continues.
 */
function onActionSuccess( { action, connectUrl } ) {
	if ( 'start-fresh' === action ) {
		goTo( connectUrl );
	} else if ( 'confirm-safe-mode' === action ) {
		reloadPage();
	}
	// Migrate shows its done view first; its button reloads.
}

/**
 * Render the Safe Mode screen into its container.
 *
 * @param {HTMLElement} container - The container element.
 * @param {boolean}     isNotice  - Whether it is the admin notice's container rather than a custom one.
 */
function renderInto( container, isNotice ) {
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

	const root = WPElement.createRoot( container );

	if ( isNotice && shouldUseNewScreen() ) {
		root.render(
			<div className="jp-identity-crisis-notice">
				<IdentityCrisis
					context="notice"
					redirectUri={ redirectUri }
					from={ CONNECTION_FROM.connectionSafeModeNotice }
					onActionSuccess={ onActionSuccess }
					onMigratedDone={ reloadPage }
				/>
			</div>
		);
		return;
	}

	root.render(
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
}

window.addEventListener( 'load', () => render() );
