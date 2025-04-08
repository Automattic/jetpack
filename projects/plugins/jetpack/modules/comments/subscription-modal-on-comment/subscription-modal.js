/* global subscriptionData */
document.addEventListener( 'DOMContentLoaded', function () {
	const modal = document.getElementsByClassName( 'jetpack-subscription-modal' )[ 0 ];

	if ( ! modal ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscription-modal__close' )[ 0 ];

	let redirectUrl = '';
	let hasLoaded = false;

	function reloadOnCloseSubscriptionModal( customUrl ) {
		const destinationUrl = customUrl ? new URL( customUrl ) : new URL( redirectUrl );

		// Prevent redirect to external sites.
		if ( destinationUrl.hostname !== window.location.hostname ) {
			return;
		}

		try {
			localStorage.setItem(
				'jetpack-subscription-modal-on-comment-scroll-to',
				destinationUrl.hash
			);
		} catch {
			// Ok if we can't set it.
		}

		// Add cache-busting parameter
		destinationUrl.searchParams.set( '_ctn', Date.now() );
		window.location.href = destinationUrl.toString();
	}

	function JetpackSubscriptionModalOnCommentMessageListener( event ) {
		let message = event && event.data;
		if ( typeof message === 'string' ) {
			try {
				message = JSON.parse( message );
			} catch {
				return;
			}
		}

		const type = message && message.type;
		const data = message && message.data;

		if ( type !== 'subscriptionModalShow' || typeof data.url === 'undefined' ) {
			return;
		}

		if ( subscriptionData.homeUrl !== event.origin ) {
			return;
		}

		if ( data.email ) {
			const emailInput = document.querySelector(
				'.jetpack-subscription-modal__modal-content input[type=email]'
			);
			if ( ! emailInput ) {
				reloadOnCloseSubscriptionModal( data.url );
				return;
			}

			const appSource = document.querySelector(
				'.jetpack-subscription-modal__modal-content input[name=app_source]'
			);
			if ( ! appSource ) {
				reloadOnCloseSubscriptionModal( data.url );
				return;
			}

			emailInput.value = data.email;
			if ( data.is_logged_in ) {
				emailInput.setAttribute( 'readonly', 'readonly' );
				appSource.value = 'atomic-subscription-modal-li';
			}
		}

		if ( ! hasLoaded ) {
			try {
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
			} catch {
				// Ignore any errors.
			}

			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_jetpack-subscribe-modal-comm=showed&r=' +
				Math.random();

			modal.classList.toggle( 'open' );
			hasLoaded = true;
			redirectUrl = data.url;
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
