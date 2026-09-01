import { wpcomTrackEvent } from '../../../common/tracks';

/**
 * JavaScript for the Pages-Homepage connection banner event tracking.
 *
 * @param {object} $ - The jQuery object
 */

/* global jQuery */
( function ( $ ) {
	/**
	 * Track whether the "Edit Homepage" button in the banner is shown/clicked.
	 */
	$( document ).ready( function () {
		const banner = document.getElementById( 'edit-homepage-banner' );

		if ( ! banner ) {
			return;
		}

		wpcomTrackEvent( 'wpcom_pages_edit_homepage_banner_shown' );

		const bannerBtn = banner.querySelector( 'a.button-primary' );
		bannerBtn?.addEventListener( 'click', function () {
			wpcomTrackEvent( 'wpcom_pages_edit_homepage_banner_clicked' );
		} );

		const attachDismissHandler = function ( btn ) {
			btn.addEventListener( 'click', function () {
				wpcomTrackEvent( 'wpcom_pages_edit_homepage_banner_dismissed' );

				const body = new FormData();
				body.append( 'action', 'dismiss_homepage_connection_banner' );
				body.append( 'nonce', banner.dataset.nonce );
				fetch( window.ajaxurl, { method: 'POST', body } );
			} );
		};

		const dismissBtn = banner.querySelector( '.notice-dismiss' );
		if ( dismissBtn ) {
			attachDismissHandler( dismissBtn );
		} else {
			// WP core injects the dismiss button dynamically via common.js;
			// watch for it if it hasn't appeared yet.
			const observer = new MutationObserver( function () {
				const btn = banner.querySelector( '.notice-dismiss' );
				if ( btn ) {
					observer.disconnect();
					attachDismissHandler( btn );
				}
			} );
			observer.observe( banner, { childList: true, subtree: true } );
		}
	} );
} )( jQuery );
