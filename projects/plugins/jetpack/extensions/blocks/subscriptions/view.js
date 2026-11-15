import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import { showModal, spinner } from '../../shared/memberships';

/**
 * Stop the empty email field from being exposed as invalid before the visitor tries to submit.
 *
 * A `required` field that is still empty fails validation, so screen readers announce it
 * as "invalid entry" as soon as it gets focus. The markup keeps `required` for visitors
 * without JavaScript; here it is swapped for `aria-required` until the form is submitted.
 *
 * @param {HTMLFormElement} form - Subscribe form.
 */
function deferEmailRequired( form ) {
	const input = form.querySelector( 'input[type="email"][required]:not([disabled])' );
	if ( ! input ) {
		return;
	}

	input.required = false;
	input.setAttribute( 'aria-required', 'true' );
}

/**
 * Restore `required` on the email field so the browser validates it on submit.
 *
 * @param {HTMLFormElement} form - Subscribe form.
 */
function restoreEmailRequired( form ) {
	const input = form.querySelector( 'input[type="email"][aria-required="true"]' );
	if ( input ) {
		input.required = true;
	}
}

// @ts-ignore
function show_iframe_retrieve_subscriptions_from_email() {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}

	restoreEmailRequired( form );

	if ( ! form.checkValidity() ) {
		form.reportValidity();
		return;
	}

	const email = form.querySelector( 'input[type="email"]' ).value;

	show_iframe( {
		email,
		blog: form.dataset.blog,
		plan: 'newsletter',
		source: 'jetpack_retrieve_subscriptions',
		post_access_level: form.dataset.post_access_level,
		display: 'alternate',
	} );
}

function show_iframe( data ) {
	const params = new URLSearchParams( data );

	const url = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

	return showModal( url );
}

domReady( function () {
	const link = document.querySelector( '#jp_retrieve_subscriptions_link' );
	if ( link ) {
		link.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			show_iframe_retrieve_subscriptions_from_email();
		} );
	}

	const forms = document.querySelectorAll( '.wp-block-jetpack-subscriptions__container form' );
	forms.forEach( form => {
		if ( ! form.payments_attached ) {
			form.payments_attached = true;

			const button = form.querySelector( 'button[type="submit"]' );

			// Injects loading animation in hidden state
			button.insertAdjacentHTML( 'beforeend', spinner );

			// Browsers validate after the submit button's click event, including when the
			// visitor presses Enter in the field, so `required` is back in place in time.
			deferEmailRequired( form );
			button.addEventListener( 'click', () => restoreEmailRequired( form ) );

			form.addEventListener( 'submit', function ( event ) {
				if ( form.resubmitted ) {
					return;
				}

				button.classList.add( 'is-loading' );
				button.setAttribute( 'aria-busy', 'true' );
				button.setAttribute( 'aria-live', 'polite' );

				// If email is empty, we will ask for it in the modal that opens
				// Email input can be hidden for "button only style" for example.
				let email = form.querySelector( 'input[type="email"]' )?.value ?? '';

				// Fallback to provided email from the logged in user when set
				if ( ! email && form.dataset.subscriber_email ) {
					email = form.dataset.subscriber_email;
				}

				const action = form.querySelector( 'input[name=action]' ).value;

				if ( action === 'subscribe' ) {
					event.preventDefault();

					const post_id = form.querySelector( 'input[name=post_id]' )?.value ?? '';
					const tier_id = form.querySelector( 'input[name=tier_id]' )?.value ?? '';
					const app_source = form.querySelector( 'input[name=app_source]' )?.value ?? '';
					const selected_newsletter_categories =
						form.querySelector( 'input[name=selected_newsletter_categories]' )?.value ?? '';

					const params = {
						email,
						post_id,
						tier_id,
						blog: form.dataset.blog,
						plan: 'newsletter',
						source: 'jetpack_subscribe',
						app_source,
						post_access_level: form.dataset.post_access_level,
						display: 'alternate',
						selected_newsletter_categories,
					};

					show_iframe( params ).then( () => {
						// Allows hiding other modals when the subscription modal/iframe shows up, e.g. hiding the subscription overlay modal
						form.dispatchEvent( new Event( 'subscription-modal-loaded' ) );

						button.classList.remove( 'is-loading' );
						button.setAttribute( 'aria-busy', 'false' );
					} );
				}
			} );
		}
	} );
} );
