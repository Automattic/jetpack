/* global tb_show, tb_remove */

import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import {
	setPurchaseResultCookie,
	reloadPageWithPremiumContentQueryString,
} from '../../../extensions/shared/memberships';

domReady( function () {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}
	let premiumContentJWTToken = '';
	if ( ! form.payments_attached ) {
		form.payments_attached = true;
		form.addEventListener( 'submit', function ( event ) {
			const email = form.querySelector( 'input[type=email]' ).value;
			const email_clause = email ? `&email=${ encodeURIComponent( email ) }` : '';
			const post_id = form.querySelector( 'input[name=post_id]' )?.value;
			const post_id_clause = post_id ? `&post_id=${ post_id }` : '';
			const tier_id = form.querySelector( 'input[name=tier_id]' )?.value;
			const tier_id_clause = tier_id ? `&tier_id=${ tier_id }` : '';

			if ( form.resubmitted || ! email ) {
				return;
			}
			event.preventDefault();

			// get all unchecked categories
			const newsletter_category_checkboxes = Array.from(
				form.querySelectorAll(
					'.wp-block-jetpack-subscriptions__newsletter-category input[type=checkbox]'
				)
			);

			const unchecked_newsletter_categories = newsletter_category_checkboxes
				.filter( checkbox => ! checkbox.checked )
				.map( checkbox => checkbox.value );

			const has_excluded_newsletter_categories =
				unchecked_newsletter_categories.length > 0 &&
				unchecked_newsletter_categories.length !== newsletter_category_checkboxes.length; // If all are unchecked, we treat it as if no exclusions were made.

			const excluded_newsletter_categories_clause = has_excluded_newsletter_categories ? `&excluded_newsletter_categories=${unchecked_newsletter_categories.join( ',' )}` : '';

			const url =
				'https://subscribe.wordpress.com/memberships/?' +
				'blog=' +
				form.dataset.blog +
				'&plan=newsletter' +
				'&source=jetpack_subscribe' +
				'&post_access_level=' +
				form.dataset.post_access_level +
				'&display=alternate' +
				post_id_clause +
				tier_id_clause +
				email_clause +
				excluded_newsletter_categories_clause;
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
						reloadPageWithPremiumContentQueryString( premiumContentJWTToken, {
							subscribe: 'success',
						} );
					} else if ( data && data.action === 'close' ) {
						// User just aborted.
						window.removeEventListener( 'message', handleIframeResult );
						tb_remove();
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
