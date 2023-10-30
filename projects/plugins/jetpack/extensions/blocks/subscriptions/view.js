import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import { show_modal_retrieve_subscriptions_from_email, show_modal } from '../../shared/memberships';

domReady( function () {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}

	const post_id = form.querySelector( 'input[name=post_id]' )?.value ?? '';
	const link = document.querySelector( '#jp_retrieve_subscriptions_link' + post_id );
	if ( link ) {
		link.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			// get the email from the form
			const email = form.querySelector( 'input[type=email]' ).value;
			show_modal_retrieve_subscriptions_from_email( form.dataset.blog, email );
		} );
	}

	if ( ! form.payments_attached ) {
		form.payments_attached = true;
		form.addEventListener( 'submit', function ( event ) {
			const email = form.querySelector( 'input[type=email]' ).value;

			if ( form.resubmitted || ! email ) {
				return;
			}

			event.preventDefault();

			const tier_id = form.querySelector( 'input[name=tier_id]' )?.value ?? '';

			show_modal( {
				email,
				post_id,
				tier_id,
				blog: form.dataset.blog,
				plan: 'newsletter',
				source: 'jetpack_subscribe',
				post_access_level: form.dataset.post_access_level,
			} );
		} );
	}
} );
