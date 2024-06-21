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
			// eslint-disable-next-line no-empty
		} catch ( e ) {}
		// For avoiding Firefox reload, we need to force reload bypassing the cache.
		window.location.reload( true );
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
				// eslint-disable-next-line no-empty
			} catch ( e ) {}

			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/g.gif?v=wpcom-no-pv&x_jetpack-subscribe-modal-comm=showed&r=' +
				Math.random();

			modal.classList.toggle( 'open' );
			hasLoaded = true;
			redirectUrl = data.url;
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
