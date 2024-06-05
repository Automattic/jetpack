const { domReady } = wp;

domReady( function () {
	const overlay = document.querySelector( '.jetpack-subscribe-overlay' );
	const overlayDismissedCookie = 'jetpack_post_subscribe_overlay_dismissed';
	const hasOverlayDismissedCookie =
		document.cookie && document.cookie.indexOf( overlayDismissedCookie ) > -1;

	if ( ! overlay || hasOverlayDismissedCookie ) {
		return;
	}

	const close = document.querySelector( '.jetpack-subscribe-overlay__close' );
	close.onclick = function ( event ) {
		event.preventDefault();
		closeOverlay();
	};

	const toContent = document.querySelector( '.jetpack-subscribe-overlay__to-content' );
	// User can edit overlay, and could remove to content link.
	if ( toContent ) {
		toContent.onclick = function ( event ) {
			event.preventDefault();
			closeOverlay();
		};
	}

	const form = document.querySelector( '.jetpack-subscribe-overlay form' );
	if ( form ) {
		form.addEventListener( 'submit', closeOverlay );
	}

	function closeOverlayOnEscapeKeydown( event ) {
		if ( event.key === 'Escape' ) {
			closeOverlay();
		}
	}

	function openOverlay() {
		overlay.classList.add( 'open' );
		document.body.classList.add( 'jetpack-subscribe-overlay-open' );
		setOverlayDismissedCookie();
		window.addEventListener( 'keydown', closeOverlayOnEscapeKeydown );
	}

	function closeOverlay() {
		overlay.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-overlay-open' );
		window.removeEventListener( 'keydown', closeOverlayOnEscapeKeydown );
	}

	function setOverlayDismissedCookie() {
		// Expires in 7 days
		const expires = new Date( Date.now() + 7 * 86400 * 1000 ).toUTCString();
		document.cookie = `${ overlayDismissedCookie }=true; expires=${ expires }; path=/;`;
	}

	openOverlay();
} );
