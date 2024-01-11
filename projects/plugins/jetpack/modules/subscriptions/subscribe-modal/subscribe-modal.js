const { domReady } = wp;

domReady( function () {
	const modal = document.getElementsByClassName( 'jetpack-subscribe-modal' )[ 0 ];

	if ( ! modal ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscribe-modal__close' )[ 0 ];
	const modalDismissedCookie = 'jetpack_post_subscribe_modal_dismissed';
	const hasModalDismissedCookie =
		document.cookie && document.cookie.indexOf( modalDismissedCookie ) > -1;
	let hasLoaded = false;
	let isScrolling;

	window.onscroll = function () {
		window.clearTimeout( isScrolling );

		isScrolling = setTimeout( function () {
			if ( ! hasLoaded && ! hasModalDismissedCookie ) {
				modal.classList.add( 'open' );
				document.body.classList.add( 'jetpack-subscribe-modal-open' );
				hasLoaded = true;
			}
		}, 300 );
	};

	// User can edit modal, and could remove close link.
	if ( close ) {
		close.onclick = function () {
			closeModal();
		};
	}

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			closeModal();
		}
	};

	function closeModal() {
		modal.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-modal-open' );
		setModalDismissedCookie();
	}

	function setModalDismissedCookie() {
		// Expires in 1 day
		const expires = new Date( Date.now() + 86400 * 1000 ).toUTCString();
		document.cookie = `${ modalDismissedCookie }=true; expires=${ expires };path=/;`;
	}
} );
