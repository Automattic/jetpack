/* global tb_show */

import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import { handleIframeResult } from '../../../extensions/shared/memberships';

domReady( function () {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}
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

			// If all are unchecked, we treat it as if no exclusions were made.
			const has_excluded_newsletter_categories =
				unchecked_newsletter_categories.length > 0 &&
				unchecked_newsletter_categories.length !== newsletter_category_checkboxes.length; // If all are unchecked, we treat it as if no exclusions were made.

			let url =
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
				email_clause;

			if ( has_excluded_newsletter_categories ) {
				url += '&excluded_newsletter_categories=' + unchecked_newsletter_categories.join( ',' );
			}

			window.scrollTo( 0, 0 );
			tb_show( null, url + '&TB_iframe=true', null );

			window.addEventListener( 'message', handleIframeResult, false );
			const tbWindow = document.querySelector( '#TB_window' );
			tbWindow.classList.add( 'jetpack-memberships-modal' );

			// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
			window.scrollTo( 0, 0 );
		} );
	}
} );
