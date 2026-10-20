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

	const dialog = modal.querySelector( '.jetpack-subscribe-modal__modal-content' ) || modal;
	dialog.setAttribute( 'role', 'dialog' );
	dialog.setAttribute( 'aria-modal', 'true' );
	dialog.setAttribute( 'tabindex', '-1' );
	const heading = dialog.querySelector( 'h1, h2, h3, h4, h5, h6' );
	if ( heading ) {
		heading.id = heading.id || 'jetpack-subscribe-modal-heading';
		dialog.setAttribute( 'aria-labelledby', heading.id );
	} else {
		dialog.setAttribute( 'aria-label', Jetpack_Subscriptions.modalLabel );
	}

	let focusBeforeOpen = null;

	function getFocusableElements() {
		return Array.from(
			dialog.querySelectorAll(
				'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		);
	}

	// The page behind stays in the tab order, so wrap Tab and Shift+Tab at the dialog's edges.
	function keepFocusInDialog( event ) {
		if ( event.key !== 'Tab' ) {
			return;
		}
		const focusable = getFocusableElements();
		if ( ! focusable.length ) {
			event.preventDefault();
			return;
		}
		const first = focusable[ 0 ];
		const last = focusable[ focusable.length - 1 ];
		if (
			event.shiftKey &&
			( document.activeElement === first || document.activeElement === dialog )
		) {
			event.preventDefault();
			last.focus();
		} else if ( ! event.shiftKey && document.activeElement === last ) {
			event.preventDefault();
			first.focus();
		}
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

		focusBeforeOpen = document.activeElement;
		modal.classList.add( 'open' );
		document.body.classList.add( 'jetpack-subscribe-modal-open' );
		dialog.addEventListener( 'keydown', keepFocusInDialog );
		dialog.focus();
		// The dialog is still hidden at the start of its fade-in, so focus can fail until that ends.
		if ( document.activeElement !== dialog ) {
			dialog.addEventListener( 'transitionend', () => dialog.focus(), { once: true } );
		}
		window.addEventListener( 'keydown', closeModalOnEscapeKeydown );
		window.addEventListener( 'click', closeOnWindowClick );
		removeEventListeners();
	}

	function closeModal() {
		modal.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-modal-open' );
		dialog.removeEventListener( 'keydown', keepFocusInDialog );
		if ( dialog.contains( document.activeElement ) ) {
			// The pop-up only opens while nothing has focus, so this returns focus to the page.
			if ( focusBeforeOpen && focusBeforeOpen !== document.body && focusBeforeOpen.focus ) {
				focusBeforeOpen.focus();
			} else {
				document.activeElement.blur();
			}
		}
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
