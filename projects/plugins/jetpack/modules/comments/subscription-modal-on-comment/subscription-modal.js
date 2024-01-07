document.addEventListener( 'DOMContentLoaded', function () {
	const modal = document.getElementsByClassName( 'jetpack-subscription-modal' )[ 0 ];

	if ( ! modal ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscription-modal__close' )[ 0 ];
	const subscribeForms = document.querySelectorAll( '.jetpack-subscription-modal__form' );

	let redirectUrl = '';
	let subscriptionData = '';
	let hasLoaded = false;

	function reloadOnCloseSubscriptionModal( customUrl ) {
		const destinationUrl = customUrl ? new URL( customUrl ) : new URL( redirectUrl );

		// Prevent redirect to external sites.
		if ( destinationUrl.hostname !== window.location.hostname ) {
			return;
		}

		localStorage.setItem( 'jetpack-subscription-modal-on-comment-scroll-to', destinationUrl.hash );

		// For avoiding Firefox reload, we need to force reload bypassing the cache.
		window.location.reload( true );
	}

	function handleSubscriptionModalIframeResult( eventFromIframe ) {
		if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
			const data = JSON.parse( eventFromIframe.data );
			const iframeElement = document.querySelector( '.jetpack-subscription-modal__iframe' );
			if ( data && data.action === 'close' ) {
				window.removeEventListener( 'message', handleSubscriptionModalIframeResult );
				iframeElement.src = 'about:blank';
				reloadOnCloseSubscriptionModal( subscriptionData.url );
			}
		}
	}

	function showSubscriptionIframe( subscriptionData ) {
		const modalContainer = document.querySelector( '.jetpack-subscription-modal' );
		const iframeElement = document.querySelector( '.jetpack-subscription-modal__iframe' );
		const subscribeData = {
			email: document.querySelector( '.jetpack-subscription-modal__form-email' ).value,
			post_id: subscriptionData.post_id,
			plan: 'newsletter',
			blog: subscriptionData.blog_id,
			source: 'jetpack_subscribe',
			display: 'alternate',
			app_source: subscriptionData.is_logged_in
				? 'atomic-subscription-modal-li'
				: 'atomic-subscription-modal-lo',
			locale: subscriptionData.lang,
		};
		const params = new URLSearchParams( subscribeData );

		iframeElement.src = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

		modalContainer.classList.add( 'has-iframe' );

		window.addEventListener( 'message', handleSubscriptionModalIframeResult, false );
	}

	function JetpackSubscriptionModalOnCommentMessageListener( event ) {
		let message = event && event.data;
		if ( typeof message === 'string' ) {
			try {
				message = JSON.parse( message );
			} catch ( err ) {
				return;
			}
		}

		const type = message && message.type;
		const data = message && message.data;

		if ( type !== 'subscriptionModalShow' || typeof data.url === 'undefined' ) {
			return;
		}

		if ( ! event.origin.includes( window.location.host ) ) {
			return;
		}

		if ( data.email ) {
			const emailInput = document.querySelector( '.jetpack-subscription-modal__form-email' );
			emailInput.value = data.email;
			if ( data.is_logged_in ) {
				emailInput.setAttribute( 'readonly', 'readonly' );
			}
		}

		if ( ! hasLoaded ) {
			const storedCount = parseInt(
				sessionStorage.getItem( 'jetpack-subscription-modal-shown-count' )
			);
			const showCount = ( isNaN( storedCount ) ? 0 : storedCount ) + 1;
			sessionStorage.setItem( 'jetpack-subscription-modal-shown-count', showCount );

			if ( showCount > 5 ) {
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_jetpack-subscribe-modal-comm=hidden_views_limit&r=' +
					Math.random();

				reloadOnCloseSubscriptionModal( data.url );
				return;
			}

			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_jetpack-subscribe-modal-comm=showed&r=' +
				Math.random();

			modal.classList.toggle( 'open' );
			hasLoaded = true;
			redirectUrl = data.url;
			subscriptionData = data;
			return;
		}
	}

	window.addEventListener( 'message', JetpackSubscriptionModalOnCommentMessageListener );

	if ( close ) {
		close.onclick = function ( event ) {
			event.preventDefault();
			modal.classList.toggle( 'open' );
			reloadOnCloseSubscriptionModal();
		};
	}

	subscribeForms.forEach( form => {
		form.addEventListener( 'submit', function ( event ) {
			if ( form.resubmitted ) {
				return;
			}

			const emailInput = form.querySelector( 'input[type=email]' );
			const email = emailInput ? emailInput.value : form.dataset.subscriber_email;

			if ( ! email ) {
				return;
			}
			event.preventDefault();
			showSubscriptionIframe( subscriptionData );
			return;
		} );
	} );

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			modal.style.display = 'none';
			reloadOnCloseSubscriptionModal();
		}
	};

	window.addEventListener( 'load', () => {
		// Scroll to the last comment.
		const subscriptionScroll = localStorage.getItem(
			'jetpack-subscription-modal-on-comment-scroll-to'
		);

		if ( subscriptionScroll ) {
			window.location.hash = subscriptionScroll;
			localStorage.removeItem( 'jetpack-subscription-modal-on-comment-scroll-to' );

			const comment = document.querySelector( subscriptionScroll );
			if ( comment ) {
				comment.scrollIntoView( { block: 'center', behavior: 'smooth' } );
			}
		}
	} );
} );
