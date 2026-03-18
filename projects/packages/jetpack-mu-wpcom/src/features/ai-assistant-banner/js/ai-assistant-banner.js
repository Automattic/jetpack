/* global jQuery */
( function ( $ ) {
	/**
	 * Record a Tracks event via the _tkq global.
	 *
	 * @param {string} eventName - The event name to record.
	 */
	function trackEvent( eventName ) {
		window._tkq = window._tkq || [];
		window._tkq.push( [ 'recordEvent', eventName ] );
	}

	$( document ).ready( function () {
		const banner = document.getElementById( 'wpcom-ai-assistant-banner' );

		if ( ! banner ) {
			return;
		}

		trackEvent( 'jetpack_ai_assistant_banner_impression' );

		const ctaBtn = banner.querySelector( '.button-secondary' );
		ctaBtn?.addEventListener( 'click', function () {
			trackEvent( 'jetpack_ai_assistant_banner_cta_click' );
		} );

		const dismissBtn = banner.querySelector( '.notice-dismiss' );
		dismissBtn?.addEventListener( 'click', function () {
			trackEvent( 'jetpack_ai_assistant_banner_dismiss' );

			$.post( window.ajaxurl, {
				action: 'dismiss_ai_assistant_banner',
				nonce: banner.dataset.nonce,
			} );

			banner.style.display = 'none';
		} );
	} );
} )( jQuery );
