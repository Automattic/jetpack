/* global jetpackSiteHealth */
/**
 * This script runs on the site health page.
 */

jQuery( document ).ready( function( $ ) {
	var JetpackSync = {
		inProgress: true,
		progressPercent: 0,
		interval: false,
		init: function() {
			JetpackSync.progressPercent = parseInt( jetpackSiteHealth.progressPercent );
			JetpackSync.setProgress();
			JetpackSync.interval = setInterval( JetpackSync.checkProgress, 3000 );
			$( 'body' ).on(
				'click',
				'[aria-controls=health-check-accordion-block-jetpack_test__full_sync_health]',
				JetpackSync.setProgress
			);
		},
		accordionButton: function() {
			return $( '[aria-controls=health-check-accordion-block-jetpack_test__full_sync_health]' );
		},
		accordionIsOpen: function() {
			return JetpackSync.accordionButton().attr( 'aria-expanded' );
		},
		checkProgress: function() {
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
				// When the accordion is open, we remove the progress percentage from the accordion heading,
				// and show a progress bar in the accordion body.
				$( '.jetpack-sync-progress-bar' ).progressbar( { value: JetpackSync.progressPercent } );
				$( '.jetpack-sync-progress-label' ).text( JetpackSync.progressPercent + '%' );
				JetpackSync.accordionButton()
					.find( '.title' )
					.text( jetpackSiteHealth.syncProgressHeading );
			} else {
				// When the accordion is closed, we show the progress percentage in the accordion heading.
				JetpackSync.accordionButton()
					.find( '.title' )
					.text(
						jetpackSiteHealth.syncProgressHeading + ' - ' + JetpackSync.progressPercent + '%'
					);
			}
		},
	};

	if ( jetpackSiteHealth.progressPercent ) {
		setTimeout( function() {
			JetpackSync.init();
		}, 5000 );
	}

	$( 'body' ).on( 'click', '#full_sync_request_link', function() {
		var data = {
			action: 'jetpack_debugger_full_sync_start',
			'site-health-nonce': jetpackSiteHealth.fullSyncNonce,
		};
		$.post( jetpackSiteHealth.ajaxUrl, data, function( response ) {
			window.location.reload( true );
		} );
	} );
} );
