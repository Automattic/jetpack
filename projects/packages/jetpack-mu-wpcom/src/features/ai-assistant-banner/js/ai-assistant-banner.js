import { wpcomTrackEvent } from '../../../common/tracks';

/**
 * JavaScript for the AI Assistant banner event tracking and dismiss handling.
 *
 * @param {object} $ - The jQuery object
 */

/* global jQuery */
( function ( $ ) {
	$( document ).ready( function () {
		const banner = document.getElementById( 'wpcom-ai-assistant-banner' );

		if ( ! banner ) {
			return;
		}

		wpcomTrackEvent( 'wpcom_tip_ai_assistant_banner_impression' );

		const ctaBtn = banner.querySelector( '.wpcom-ai-assistant-banner__cta' );
		ctaBtn?.addEventListener( 'click', function () {
			wpcomTrackEvent( 'wpcom_tip_ai_assistant_banner_cta_click' );
		} );

		const dismissBtn = banner.querySelector( '.wpcom-ai-assistant-banner__dismiss' );
		dismissBtn?.addEventListener( 'click', function () {
			wpcomTrackEvent( 'wpcom_tip_ai_assistant_banner_dismiss' );

			$.post( window.ajaxurl, {
				action: 'dismiss_ai_assistant_banner',
				nonce: banner.dataset.nonce,
			} );

			banner.style.display = 'none';
		} );
	} );
} )( jQuery );
