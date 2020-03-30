/**
 * This script runs on the site health page.
 */
jQuery( document ).ready( function( $ ) {
	let fullSyncInProgress = false,
		fullSyncPercent = 0;
	const syncProgressInterval = setInterval( jetpackSyncProgressCheck, 3000 );
	/**
	 * Every 3 seconds, check for full sync progress. If a full sync is in progress,
	 * we'll update the progress bar and text. If a full sync is not in progress we'll clear the timer.
	 */
	function jetpackSyncProgressCheck() {
		jQuery.post( jetpackSiteHealth.ajaxUrl, { action: 'jetpack_sync_progress_check' }, function(
			response
		) {
			if ( 'done' === response ) {
				clearInterval( syncProgressInterval );
				if ( fullSyncInProgress ) {
					fullSyncPercent = 100;
					jetpackSyncSetProgress();
				}
				fullSyncInProgress = false;
				console.log( 'done' );
				return;
			}
			/*if ( ! fullSyncInProgress ) {
				accordionButton.on( "click", function() {
					console.log( jetpackSyncIsAccordionOpen() );
				} );
			}*/
			fullSyncInProgress = true;
			fullSyncPercent = parseInt( response );
			jetpackSyncSetProgress();
		} );
	}

	function jetpackSyncSetProgress() {
		const accordionButton = $(
			'[aria-controls=health-check-accordion-block-jetpack_test__sync_health]'
		);
		const accordionIsOpen = accordionButton.attr( 'aria-expanded' );
		console.log( accordionIsOpen );
		if ( 'true' === accordionIsOpen ) {
			$( '.jetpack-sync-progress' )
				.find( '.progress' )
				.text( fullSyncPercent + '%' );
		} else {
			accordionButton
				.find( '.title' )
				.text( jetpackSiteHealth.syncProgressHeading + ' - ' + fullSyncPercent + '%' );
		}
	}
} );
