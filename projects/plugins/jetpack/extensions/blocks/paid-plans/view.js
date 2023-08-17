import './view.scss';

import domReady from '@wordpress/dom-ready';
import {
	setPurchaseResultCookie,
	reloadPageWithPremiumContentQueryString,
} from '../../../extensions/shared/memberships';

domReady( function () {
	const iframe = document.querySelector( 'iframe.wp-block-jetpack-paid-plans' );
	if ( ! iframe ) {
		return;
	}
	let premiumContentJWTToken = '';

	if ( ! iframe.payments_attached ) {
		iframe.payments_attached = true;
		//TODO: Unify this code across premium content, subscribe and payment button.
		const handleIframeResult = function ( eventFromIframe ) {
			if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
				const data = JSON.parse( eventFromIframe.data );
				if ( data && data.result && data.result.jwt_token ) {
					// We save the token for now, doing nothing.
					premiumContentJWTToken = data.result.jwt_token;
					setPurchaseResultCookie( premiumContentJWTToken );
				} else if ( data && data.action === 'close' && premiumContentJWTToken ) {
					// The token was set during the purchase flow, we want to relead the whole page with token in query string so it recognizes that the user is logged in.
					reloadPageWithPremiumContentQueryString( premiumContentJWTToken, {
						subscribe: 'success',
					} );
				} else if ( data && data.action === 'close' ) {
					// User just aborted.
					window.removeEventListener( 'message', handleIframeResult );
				}
			}
		};
		window.addEventListener( 'message', handleIframeResult, false );
	}
} );
