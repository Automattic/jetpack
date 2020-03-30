/* global jetpackSiteHealth */
/**
 * This script runs on the site health page.
 */

jQuery( document ).ready( function( $ ) {
	const JetpackSync = {
		inProgress: false,
		progressPercent: 0,
		interval: false,
		init: function() {
			JetpackSync.interval = setInterval( JetpackSync.progressCheck, 3000 );
			JetpackSync.progressPercent = jetpackSiteHealth.progressPercent;
			$( 'body' ).on(
				'click',
				'[aria-controls=health-check-accordion-block-jetpack_test__sync_health]',
				JetpackSync.setProgress
			);
		},
		accordionButton: function() {
			return $( '[aria-controls=health-check-accordion-block-jetpack_test__sync_health]' );
		},
		accordionIsOpen: function() {
			return JetpackSync.accordionButton().attr( 'aria-expanded' );
		},
		progressCheck: function() {
			$.post( jetpackSiteHealth.ajaxUrl, { action: 'jetpack_sync_progress_check' }, function(
				response
			) {
				if ( 'done' === response ) {
					clearInterval( JetpackSync.interval );
					if ( JetpackSync.inProgress ) {
						JetpackSync.progressPercent = 100;
						JetpackSync.setProgress();
					}
					JetpackSync.inProgress = false;
					return;
				}
				JetpackSync.inProgress = true;
				JetpackSync.progressPercent = parseInt( response );
				JetpackSync.setProgress();
			} );
		},
		setProgress: function() {
			if ( 'true' === JetpackSync.accordionIsOpen() ) {
				$( '.jetpack-sync-progress-bar' ).progressbar( { value: JetpackSync.progressPercent } );
				JetpackSync.accordionButton()
					.find( '.title' )
					.text( jetpackSiteHealth.syncProgressHeading );
			} else {
				JetpackSync.accordionButton()
					.find( '.title' )
					.text(
						jetpackSiteHealth.syncProgressHeading + ' - ' + JetpackSync.progressPercent + '%'
					);
			}
		},
	};

	if ( jetpackSiteHealth.progressPercent ) {
		JetpackSync.init();
	}
} );
