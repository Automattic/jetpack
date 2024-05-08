const { domReady } = wp;

domReady( function () {
	const overlay = document.getElementsByClassName( 'jetpack-subscribe-overlay' )[ 0 ];
	const overlayDismissedCookie = 'jetpack_post_subscribe_overlay_dismissed';
	const hasOverlayDismissedCookie =
		document.cookie && document.cookie.indexOf( overlayDismissedCookie ) > -1;

	if ( ! overlay || hasOverlayDismissedCookie ) {
		return;
	}

	const close = document.getElementsByClassName( 'jetpack-subscribe-overlay__close' )[ 0 ];
	close.onclick = function ( event ) {
		event.preventDefault();
		closeOverlay();
	};

	const toContent = document.getElementsByClassName( 'jetpack-subscribe-overlay__to-content' )[ 0 ];
	// User can edit overlay, and could remove to content link.
	if ( toContent ) {
		toContent.onclick = function ( event ) {
			event.preventDefault();
			closeOverlay();
		};
	}

	function closeOverlayOnEscapeKeydown( event ) {
		if ( event.key === 'Escape' ) {
			closeOverlay();
		}
	}

	function openOverlay() {
		overlay.classList.add( 'open' );
		document.body.classList.add( 'jetpack-subscribe-overlay-open' );
		// setOverlayDismissedCookie();
		window.addEventListener( 'keydown', closeOverlayOnEscapeKeydown );
	}

	function closeOverlay() {
		overlay.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-overlay-open' );
		window.removeEventListener( 'keydown', closeOverlayOnEscapeKeydown );
	}

	function setOverlayDismissedCookie() {
		// Expires in 1 day (TODO: change it)
		const expires = new Date( Date.now() + 86400 * 1000 ).toUTCString();
		document.cookie = `${ overlayDismissedCookie }=true; expires=${ expires };path=/;`;
	}

	openOverlay();
} );
