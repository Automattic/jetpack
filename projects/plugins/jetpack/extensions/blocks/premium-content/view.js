import './view.scss';
import {
	setPurchaseResultCookie,
	reloadPageWithPremiumContentQueryString,
} from '../../../extensions/shared/memberships';

document.addEventListener( 'DOMContentLoaded', function () {
	let premiumContentJWTToken = '';

	/**
	 * @typedef globalThis
	 * @param {globalThis.Event} eventFromIframe - message event that gets emitted in the checkout iframe.
	 * @listens message
	 */
	function handleIframeResult( eventFromIframe ) {
		if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
			const data = JSON.parse( eventFromIframe.data );
			if ( data && data.result && data.result.jwt_token ) {
				// We save the token for now, doing nothing.
				premiumContentJWTToken = data.result.jwt_token;
				setPurchaseResultCookie( premiumContentJWTToken );
			}
			if ( data && data.action === 'close' && premiumContentJWTToken ) {
				reloadPageWithPremiumContentQueryString( premiumContentJWTToken );
			}
		}
	}

	if ( typeof window !== 'undefined' ) {
		window.addEventListener( 'message', handleIframeResult, false );
	}
} );
