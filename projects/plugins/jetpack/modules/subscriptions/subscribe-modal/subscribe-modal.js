/* global Jetpack_Subscriptions */
const { domReady } = wp;
domReady( () => {
	const modal = document.querySelector( '.jetpack-subscribe-modal' );
	const modalDismissedCookie = 'jetpack_post_subscribe_modal_dismissed';
	const skipUrlParam = 'jetpack_skip_subscription_popup';

	function hasEnoughTimePassed() {
		const lastDismissed = localStorage.getItem( modalDismissedCookie );
		return lastDismissed ? Date.now() - lastDismissed > Jetpack_Subscriptions.modalInterval : true;
	}

	// Subscriber ended up here e.g. from emails:
	// we won't show the modal to them in future since they most likely are already a subscriber.
	function skipModal() {
		const url = new URL( window.location.href );
		if ( url.searchParams.has( skipUrlParam ) ) {
			url.searchParams.delete( skipUrlParam );
			window.history.replaceState( {}, '', url );
			storeCloseTimestamp();
			return true;
		}

		return false;
	}

	if ( ! modal || ! hasEnoughTimePassed() || skipModal() ) {
		return;
	}

	const modalLoadTimeout = setTimeout( openModal, Jetpack_Subscriptions.modalLoadTime );

	const targetElement = (
		document.querySelector( '.entry-content' ) || document.documentElement
	).getBoundingClientRect();

	function hasPassedScrollThreshold() {
		const scrollPosition = window.scrollY + window.innerHeight / 2;
		const scrollPositionThreshold =
			targetElement.top +
			( targetElement.height * Jetpack_Subscriptions.modalScrollThreshold ) / 100;
		return scrollPosition > scrollPositionThreshold;
	}

	function onScroll() {
		requestAnimationFrame( () => {
			if ( hasPassedScrollThreshold() ) {
				openModal();
			}
		} );
	}

	window.addEventListener( 'scroll', onScroll, { passive: true } );

	// This take care of the case where the user has multiple tabs open.
	function onLocalStorage( event ) {
		if ( event.key === modalDismissedCookie ) {
			closeModal();
			removeEventListeners();
		}
	}
	window.addEventListener( 'storage', onLocalStorage );

	// When the form is submitted, and next modal loads, it'll fire "subscription-modal-loaded" signalling that this form can be hidden.
	const form = modal.querySelector( 'form' );
	if ( form ) {
		form.addEventListener( 'subscription-modal-loaded', closeModal );
	}

	// User can edit modal, and could remove close link.
	function onCloseButtonClick( event ) {
		event.preventDefault();
		closeModal();
	}
	const close = document.getElementsByClassName( 'jetpack-subscribe-modal__close' )[ 0 ];
	if ( close ) {
		close.addEventListener( 'click', onCloseButtonClick );
	}

	function closeOnWindowClick( event ) {
		if ( event.target === modal ) {
			closeModal();
		}
	}

	function closeModalOnEscapeKeydown( event ) {
		if ( event.key === 'Escape' ) {
			closeModal();
		}
	}

	function openModal() {
		// If the user is typing in a form, don't open the modal or has anything else focused.
		if ( document.activeElement && document.activeElement.tagName !== 'BODY' ) {
			return;
		}

		modal.classList.add( 'open' );
		document.body.classList.add( 'jetpack-subscribe-modal-open' );
		window.addEventListener( 'keydown', closeModalOnEscapeKeydown );
		window.addEventListener( 'click', closeOnWindowClick );
		removeEventListeners();
	}

	function closeModal() {
		modal.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-modal-open' );
		window.removeEventListener( 'keydown', closeModalOnEscapeKeydown );
		window.removeEventListener( 'storage', onLocalStorage );
		window.removeEventListener( 'click', closeOnWindowClick );
		storeCloseTimestamp();
	}

	// Remove all event listeners. That would add the modal again.
	function removeEventListeners() {
		window.removeEventListener( 'scroll', onScroll );
		clearTimeout( modalLoadTimeout );
	}

	function storeCloseTimestamp() {
		localStorage.setItem( modalDismissedCookie, Date.now() );
	}
} );
