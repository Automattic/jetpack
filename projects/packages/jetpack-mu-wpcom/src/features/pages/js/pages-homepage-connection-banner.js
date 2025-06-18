import { wpcomTrackEvent } from 'wpcom-tracks-module';

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
	} );
} )( jQuery );
