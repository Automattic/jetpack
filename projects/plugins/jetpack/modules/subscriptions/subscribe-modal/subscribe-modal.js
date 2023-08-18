const { domReady } = wp;

domReady( function () {
	const modal = document.getElementsByClassName( 'jetpack-subscribe-modal' )[ 0 ];

	if ( ! modal ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscribe-modal__close' )[ 0 ];
	const modalDismissedCookie = 'jetpack_subscribe_modal_dismissed';
	const hasModalDismissedCookie =
		document.cookie && document.cookie.indexOf( modalDismissedCookie ) > -1;
	let hasLoaded = false;
	let isScrolling;

	window.onscroll = function () {
		window.clearTimeout( isScrolling );

		isScrolling = setTimeout( function () {
			if ( ! hasLoaded && ! hasModalDismissedCookie ) {
				modal.classList.toggle( 'open' );
				hasLoaded = true;
			}
		}, 300 );
	};

	// User can edit modal, and could remove close link.
	if ( close ) {
		close.onclick = function () {
			modal.classList.toggle( 'open' );
			setModalDismissedCookie();
		};
	}

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			modal.style.display = 'none';
			setModalDismissedCookie();
		}
	};

	function setModalDismissedCookie() {
		// Expires in 1 day
		const expires = new Date( Date.now() + 86400 * 1000 ).toUTCString();
		document.cookie = `${ modalDismissedCookie }=true; expires=${ expires };`;
	}
} );
