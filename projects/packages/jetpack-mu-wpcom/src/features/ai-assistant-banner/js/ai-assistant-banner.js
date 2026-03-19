/* global jQuery */
import { wpcomTrackEvent } from '../../../common/tracks';

( function ( $ ) {
	$( document ).ready( function () {
		const banner = document.getElementById( 'wpcom-ai-assistant-banner' );

		if ( ! banner ) {
			return;
		}

		wpcomTrackEvent( 'jetpack_ai_assistant_banner_impression' );

		const ctaBtn = banner.querySelector( '.button-secondary' );
		ctaBtn?.addEventListener( 'click', function () {
			wpcomTrackEvent( 'jetpack_ai_assistant_banner_cta_click' );
		} );

		const dismissBtn = banner.querySelector( '.notice-dismiss' );
		dismissBtn?.addEventListener( 'click', function () {
			wpcomTrackEvent( 'jetpack_ai_assistant_banner_dismiss' );

			$.post( window.ajaxurl, {
				action: 'dismiss_ai_assistant_banner',
				nonce: banner.dataset.nonce,
			} );

			banner.style.display = 'none';
		} );
	} );
} )( jQuery );
