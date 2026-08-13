const { domReady } = wp;
domReady( () => {
	const modal = document.querySelector( '.jetpack-subscribe-modal-button' );
	if ( ! modal ) {
		return;
	}

	function closeModal() {
		modal.classList.remove( 'open' );
		document.body.classList.remove( 'jetpack-subscribe-modal-button-open' );
	}

	// Opening is triggered from the "Button only" Subscribe block's own
	// submit handler (extensions/blocks/subscriptions/view.js), not here —
	// this file only wires up how to close it again once open.
	window.addEventListener( 'click', event => {
		if ( event.target === modal ) {
			closeModal();
		}
	} );

	window.addEventListener( 'keydown', event => {
		if ( event.key === 'Escape' && modal.classList.contains( 'open' ) ) {
			closeModal();
		}
	} );

	// When the pop-up's own embedded Subscribe block form is submitted, the
	// checkout iframe takes over — hide this pop-up so it's not left open
	// underneath it.
	const form = modal.querySelector( 'form' );
	if ( form ) {
		form.addEventListener( 'subscription-modal-loaded', closeModal );
	}
} );
