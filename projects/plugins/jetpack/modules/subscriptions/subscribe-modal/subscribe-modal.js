/* global Jetpack_Subscriptions */
const { domReady } = wp;

domReady( function () {
	const modal = document.getElementsByClassName( 'jetpack-subscribe-modal' )[ 0 ];
	const modalDismissedCookie = 'jetpack_post_subscribe_modal_dismissed';
	const hasModalDismissedCookie =
		document.cookie && document.cookie.indexOf( modalDismissedCookie ) > -1;

	if ( ! modal || hasModalDismissedCookie ) {
		return;
	}

	let hasLoaded = false;
	let isScrolling;
	const timeToWait = Jetpack_Subscriptions.modalLoadTime;
	const scrollThreshold = Jetpack_Subscriptions.modalScrollThreshold;

	function hasPassedScrollThreshold() {
		const scrollPosition = window.scrollY || document.documentElement.scrollTop;
		const windowHeight = window.innerHeight;
		const fullHeight = document.documentElement.scrollHeight;
		const scrollableDistance = fullHeight - windowHeight;

		if ( scrollableDistance <= 0 ) {
			return false; // Content fits in viewport, no scrolling needed
		}

		const scrollPercentage = ( scrollPosition / scrollableDistance ) * 100;
		return scrollPercentage > scrollThreshold;
	}

	function checkConditionsAndOpenModal() {
		if ( ! hasLoaded && ( hasPassedScrollThreshold() || Date.now() - startTime >= timeToWait ) ) {
			openModal();
		}
	}

	window.onscroll = function () {
		window.clearTimeout( isScrolling );
		isScrolling = setTimeout( function () {
			checkConditionsAndOpenModal();
		}, 100 );
	};

	// When the form is submitted, and next modal loads, it'll fire "subscription-modal-loaded" signalling that this form can be hidden.
	const form = modal.querySelector( 'form' );
	if ( form ) {
		form.addEventListener( 'subscription-modal-loaded', closeModal );
	}
	const startTime = Date.now();
	setTimeout( checkConditionsAndOpenModal, timeToWait );

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

	function closeModalOnEscapeKeydown( event ) {
		if ( event.key === 'Escape' ) {
			closeModal();
		}
	}

	function openModal() {
		modal.classList.add( 'open' );
		document.body.classList.add( 'jetpack-subscribe-modal-open' );
		hasLoaded = true;
		setModalDismissedCookie();
		window.addEventListener( 'keydown', closeModalOnEscapeKeydown );
	}

	function closeModal() {
		modal.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-modal-open' );
		window.removeEventListener( 'keydown', closeModalOnEscapeKeydown );
	}

	function setModalDismissedCookie() {
		// Expires in 1 day
		const expires = new Date( Date.now() + 86400 * 1000 ).toUTCString();
		document.cookie = `${ modalDismissedCookie }=true; expires=${ expires };path=/;`;
	}
} );
