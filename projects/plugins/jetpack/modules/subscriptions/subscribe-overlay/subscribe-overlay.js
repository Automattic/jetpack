const { domReady } = wp;

domReady( function () {
	const overlay = document.querySelector( '.jetpack-subscribe-overlay' );
	const overlayDismissedCookie = 'jetpack_post_subscribe_overlay_dismissed';
	const hasOverlayDismissedCookie =
		document.cookie && document.cookie.indexOf( overlayDismissedCookie ) > -1;

	if ( ! overlay || hasOverlayDismissedCookie ) {
		return;
	}

	const close = overlay.querySelector( '.jetpack-subscribe-overlay__close' );
	close.onclick = function ( event ) {
		event.preventDefault();
		closeOverlay();
	};

	const toContent = overlay.querySelector( '.jetpack-subscribe-overlay__to-content' );
	// User can edit overlay, and could remove to content link.
	if ( toContent ) {
		toContent.onclick = function ( event ) {
			event.preventDefault();
			closeOverlay();
		};
	}

	// When the form is submitted, and next modal loads, it'll fire "subscription-modal-loaded" signalling that this form can be hidden.
	const form = overlay.querySelector( 'form' );
	if ( form ) {
		form.addEventListener( 'subscription-modal-loaded', closeOverlay );
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
		document.cookie = `${ overlayDismissedCookie }=true; path=/;`;
	}

	openOverlay();
} );
