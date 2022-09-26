/* global tb_show, tb_remove */

import './view.scss';
import '../../shared/memberships.scss';
import domReady from '@wordpress/dom-ready';
import {
	setPurchaseResultCookie,
	reloadPageWithPremiumContentQueryString,
} from '../../../extensions/shared/memberships';

domReady( function () {
	const form = document.querySelector( '.jetpack_subscription_widget form' );
	let premiumContentJWTToken = '';
	if ( ! form.payments_attached ) {
		form.payments_attached = true;
		form.addEventListener( 'submit', function ( event ) {
			const email = form.querySelector( 'input[type=email]' ).value;
			if ( form.resubmitted || ! email ) {
				return;
			}
			event.preventDefault();
			const url =
				'https://subscribe.wordpress.com/memberships/?blog=' +
				form.dataset.blog +
				'&plan=newsletter&source=jetpack_subscribe&design=alternate&email=' +
				encodeURIComponent( email );
			window.scrollTo( 0, 0 );
			tb_show( null, url + '&TB_iframe=true', null );

			//TODO: Unify this code across premium content, subscribe and payment button.
			const handleIframeResult = function ( eventFromIframe ) {
				if (
					eventFromIframe.origin === 'https://subscribe.wordpress.com' &&
					eventFromIframe.data
				) {
					const data = JSON.parse( eventFromIframe.data );
					if ( data && data.result && data.result.jwt_token ) {
						// We save the token for now, doing nothing.
						premiumContentJWTToken = data.result.jwt_token;
						setPurchaseResultCookie( premiumContentJWTToken );
					} else if ( data && data.action === 'close' && premiumContentJWTToken ) {
						// The token was set during the purchase flow, we want to relead the whole page with token in query string so it recognizes that the user is logged in.
						reloadPageWithPremiumContentQueryString( premiumContentJWTToken );
					} else if ( data && data.action === 'close' ) {
						// User just aborted.
						window.removeEventListener( 'message', handleIframeResult );
						tb_remove();
					} else if ( data && data.action === 'jetpack_subscribe_continue' ) {
						// User chose free option for subscribing, so we want to continue default behaviour of using the subscribe form.
						form.resubmitted = true;
						form.querySelector( '#subscribe-submit button' ).click();
					}
				}
			};
			window.addEventListener( 'message', handleIframeResult, false );
			const tbWindow = document.querySelector( '#TB_window' );
			tbWindow.classList.add( 'jetpack-memberships-modal' );

			// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
			window.scrollTo( 0, 0 );
		} );
	}
} );
