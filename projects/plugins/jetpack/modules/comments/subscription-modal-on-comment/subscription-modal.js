// eslint-disable-next-line no-undef
const smDomReady = typeof domReady !== 'undefined' ? domReady : wp.domReady;

smDomReady( function () {
	const modal = document.getElementsByClassName( 'jetpack-subscription-modal' )[ 0 ];

	if ( ! modal ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscription-modal__close' )[ 0 ];
	let redirectUrl = '';
	let hasLoaded = false;

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

		// TODO: add a check for origin

		// TODO: Check number of times shown. If shown more than 5 times, don't show again.
		if ( ! hasLoaded ) {
			modal.classList.toggle( 'open' );
			hasLoaded = true;
			redirectUrl = data.url;
			return;
		}
	}

	window.addEventListener( 'message', JetpackSubscriptionModalOnCommentMessageListener );

	if ( close ) {
		close.onclick = function () {
			modal.classList.toggle( 'open' );
			window.location.href = redirectUrl;
		};
	}

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			modal.style.display = 'none';
			window.location.href = redirectUrl;
		}
	};
} );
