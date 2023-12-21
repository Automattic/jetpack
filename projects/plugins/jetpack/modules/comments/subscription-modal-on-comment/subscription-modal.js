document.addEventListener( 'DOMContentLoaded', function () {
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

		if ( ! event.origin.includes( window.location.host ) ) {
			return;
		}

		if ( ! hasLoaded ) {
			const storedCount = parseInt(
				sessionStorage.getItem( 'jetpack-subscription-modal-shown-count' )
			);
			const showCount = ( isNaN( storedCount ) ? 0 : 1 ) + 1;
			sessionStorage.setItem( 'jetpack-subscription-modal-shown-count', showCount );

			if ( showCount >= 5 ) {
				return;
			}

			modal.classList.toggle( 'open' );
			hasLoaded = true;
			redirectUrl = data.url;
			return;
		}
	}

	window.addEventListener( 'message', JetpackSubscriptionModalOnCommentMessageListener );

	function reloadOnCloseSubscriptionModal() {
		const destinationUrl = new URL( redirectUrl );

		// current URL without hash
		const currentUrlWithoutHash = location.href.replace( location.hash, '' );
		// destination URL without hash
		const destinationUrlWithoutHash = destinationUrl.href.replace( destinationUrl.hash, '' );
		window.location.href = redirectUrl;

		// reload the page if the user is already on the comment page
		if ( currentUrlWithoutHash === destinationUrlWithoutHash ) {
			window.location.reload();
		}
	}

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
} );
