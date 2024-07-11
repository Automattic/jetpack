/* global Jetpack_Subscriptions */
const { domReady } = wp;
domReady( function () {
	const modal = document.getElementsByClassName( 'jetpack-subscribe-modal' )[ 0 ];
	const modalDismissedCookie = 'jetpack_post_subscribe_modal_dismissed';
	const timeSinceLastModal = localStorage.getItem( modalDismissedCookie );
	const hasEnoughTimePassed = Date.now() - timeSinceLastModal > Jetpack_Subscriptions.modalInterval;

	if ( ! modal || ! hasEnoughTimePassed ) {
		return;
	}

	let hasLoaded = false;
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
		if ( ! hasLoaded ) {
			requestAnimationFrame( () => {
				if ( hasPassedScrollThreshold() ) {
					openModal();
				}
			} );
		}
	}

	window.addEventListener( 'scroll', onScroll, { passive: true } );

	setTimeout( () => {
		if ( ! hasLoaded ) {
			openModal();
		}
	}, Jetpack_Subscriptions.modalLoadTime );

	// When the form is submitted, and next modal loads, it'll fire "subscription-modal-loaded" signalling that this form can be hidden.
	const form = modal.querySelector( 'form' );
	if ( form ) {
		form.addEventListener( 'subscription-modal-loaded', closeModal );
	}

	// User can edit modal, and could remove close link.
	const close = document.getElementsByClassName( 'jetpack-subscribe-modal__close' )[ 0 ];
	if ( close ) {
		close.onclick = function ( event ) {
			event.preventDefault();
			closeModal();
		};
	}

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			closeModal();
		}
	};

	window.addEventListener( 'storage', onLocalStorage );
	// This take care of the case where the user has multiple tabs open.
	function onLocalStorage( event ) {
		if ( event.key === modalDismissedCookie ) {
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
		window.removeEventListener( 'scroll', onScroll );
		window.removeEventListener( 'storage', onLocalStorage );
	}

	function closeModal() {
		modal.classList.remove( 'open' );
		wasClosed = true;
		document.body.classList.remove( 'jetpack-subscribe-modal-open' );
		window.removeEventListener( 'keydown', closeModalOnEscapeKeydown );
		setLocalStorage();
	}

	function setLocalStorage() {
		if ( window.localStorage ) {
			localStorage.setItem( modalDismissedCookie, Date.now() );
		}
	}
} );
