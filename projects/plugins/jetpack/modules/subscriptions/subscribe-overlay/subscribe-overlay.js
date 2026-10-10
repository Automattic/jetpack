const { domReady } = wp;

domReady( function () {
	const overlay = document.querySelector( '.jetpack-subscribe-overlay' );
	const overlayDismissedCookie = 'jetpack_post_subscribe_overlay_dismissed';
	const knownSubscriberKey = 'jetpack_post_subscribe_known_subscriber';
	const skipUrlParam = 'jetpack_skip_subscription_popup';
	const hasOverlayDismissedCookie =
		document.cookie && document.cookie.indexOf( overlayDismissedCookie ) > -1;

	function getLocalStorageItem( key ) {
		try {
			return localStorage.getItem( key );
		} catch {
			return null;
		}
	}

	function hasKnownSubscriber() {
		return (
			getLocalStorageItem( knownSubscriberKey ) === 'true' ||
			document.cookie.split( '; ' ).includes( `${ knownSubscriberKey }=true` )
		);
	}

	function storeKnownSubscriber() {
		try {
			localStorage.setItem( knownSubscriberKey, 'true' );
		} catch {
			document.cookie = `${ knownSubscriberKey }=true; max-age=31536000; path=/; SameSite=Lax`;
		}
	}

	// Subscriber ended up here e.g. from emails:
	// we won't show the overlay to them in future since they most likely are already a subscriber.
	function skipOverlay() {
		const url = new URL( window.location.href );
		if ( url.searchParams.has( skipUrlParam ) ) {
			url.searchParams.delete( skipUrlParam );
			window.history.replaceState( {}, '', url );
			storeKnownSubscriber();
			return true;
		}

		return false;
	}

	if ( skipOverlay() || ! overlay || hasKnownSubscriber() || hasOverlayDismissedCookie ) {
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

	function onLocalStorage( event ) {
		if ( event.key === knownSubscriberKey ) {
			closeOverlay();
		}
	}
	window.addEventListener( 'storage', onLocalStorage );

	function onFocus() {
		if ( hasKnownSubscriber() ) {
			closeOverlay();
		}
	}
	window.addEventListener( 'focus', onFocus );

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
		window.removeEventListener( 'storage', onLocalStorage );
		window.removeEventListener( 'focus', onFocus );
	}

	function setOverlayDismissedCookie() {
		document.cookie = `${ overlayDismissedCookie }=true; path=/;`;
	}

	openOverlay();
} );
