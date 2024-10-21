import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import { getTokenFromCookie, showModal, spinner } from '../../shared/memberships';

// @ts-ignore
function show_iframe_retrieve_subscriptions_from_email() {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}

	if ( ! form.checkValidity() ) {
		form.reportValidity();
		return;
	}

	const email = form.querySelector( 'input[type=email]' ).value;

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

function render_iframe_current_user_email( blog ) {
	const existingIframe = document.getElementById( 'jp-subscribe-current-user-email-iframe' );
	if ( existingIframe ) {
		return;
	}
	const params = new URLSearchParams( {
		blog,
		plan: 'newsletter',
		source: 'jetpack_subscribe_current_user_email',
		jwt_token: getTokenFromCookie(),
	} );
	const url = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

	const iframe = document.createElement( 'iframe' );
	iframe.setAttribute( 'id', 'jp-subscribe-current-user-email-iframe' );
	iframe.style.display = 'none';
	iframe.src = url;

	document.body.appendChild( iframe );
}

function get_current_user_email( blog, emailInput ) {
	render_iframe_current_user_email( blog );

	const handleIframeMessage = message => {
		if (
			message.origin === 'https://subscribe.wordpress.com' &&
			typeof message.data === 'object' &&
			message.data.action === 'current_user_email' &&
			message.data.email
		) {
			emailInput.value = message.data.email;
			emailInput.disabled = true;
			window.removeEventListener( 'message', handleIframeMessage, false );
		}
	};

	window.addEventListener( 'message', handleIframeMessage, false );
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

			const emailInput = form.querySelector( 'input[type=email]' );

			const currentUserEmail = emailInput?.value ?? '';
			if ( ! currentUserEmail ) {
				get_current_user_email( form.dataset.blog, emailInput );
			}

			form.addEventListener( 'submit', function ( event ) {
				if ( form.resubmitted ) {
					return;
				}

				button.classList.add( 'is-loading' );
				button.setAttribute( 'aria-busy', 'true' );
				button.setAttribute( 'aria-live', 'polite' );

				// If email is empty, we will ask for it in the modal that opens
				// Email input can be hidden for "button only style" for example.
				let email = emailInput?.value ?? '';

				// Fallback to provided email from the logged in user when set
				if ( ! email && form.dataset.subscriber_email ) {
					// eslint-disable-next-line no-console
					email = form.dataset.subscriber_email;
				}

				const action = form.querySelector( 'input[name=action]' ).value;

				if ( action === 'subscribe' ) {
					event.preventDefault();

					const post_id = form.querySelector( 'input[name=post_id]' )?.value ?? '';
					const tier_id = form.querySelector( 'input[name=tier_id]' )?.value ?? '';
					const app_source = form.querySelector( 'input[name=app_source]' )?.value ?? '';

					show_iframe( {
						email,
						post_id,
						tier_id,
						blog: form.dataset.blog,
						plan: 'newsletter',
						source: 'jetpack_subscribe',
						app_source,
						post_access_level: form.dataset.post_access_level,
						display: 'alternate',
					} ).then( () => {
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
