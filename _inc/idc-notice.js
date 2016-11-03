/* global idcL10n, jQuery, analytics */

( function( $ ) {
	var restNonce = idcL10n.nonce,
		restRoot = idcL10n.apiRoot,
		notice = $( '.jp-idc-notice' ),
		idcButtons = $( '.jp-idc-notice .dops-button' ),
		tracksUser = idcL10n.tracksUserData;

	// Initialize Tracks and bump stats.
	analytics.initialize( tracksUser.userid, tracksUser.username );
	trackAndBumpMCStats( 'notice_view' );

	// Confirm Safe Mode
	$( '#jp-idc-confirm-safe-mode-action' ).click( function() {
		trackAndBumpMCStats( 'confirm_safe_mode' );
		confirmSafeMode();
	} );

	// Fix connection
	$( '#jp-idc-fix-connection-action' ).click( function() {
		trackAndBumpMCStats( 'fix_connection' );
		fixJetpackConnection();
	} );


	// Confirm Safe Mode
	$( '#jp-idc-reconnect-site-action' ).click( function() {
		startFreshConnection();
	} );

	function disableDopsButtons() {
		idcButtons.prop( 'disabled', true );
	}

	function enableDopsButtons() {
		idcButtons.prop( 'disabled', false );
	}

	function confirmSafeMode() {
		var route = restRoot + 'jetpack/v4/identity-crisis/confirm-safe-mode';
		disableDopsButtons();
		$.ajax( {
			method: 'POST',
			beforeSend : function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', restNonce );
			},
			url: route,
			data: {},
			success: function(){
				$( '.jp-idc-notice' ).hide();
			},
			error: function() {
				enableDopsButtons();
			}
		} );
	}

	function fixJetpackConnection() {
		notice.addClass( 'jp-idc-show-second-step' );
	}

	/**
	 * On successful request of the endpoint, we will redirect to the
	 * connection auth flow after appending a specific 'from=' param for tracking.
	 */
	function startFreshConnection() {
		var route = restRoot + 'jetpack/v4/identity-crisis/start-fresh';
		disableDopsButtons();
		$.ajax( {
			method: 'POST',
			beforeSend : function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', restNonce );
			},
			url: route,
			data: {},
			success: function( connectUrl ){
				// Add a from param and take them to connect.
				window.location = connectUrl + '&from=idc-notice';
			},
			error: function() {
				enableDopsButtons();
			}
		} );
	}

	/**
	 * This function will fire both a Tracks and MC stat.
	 * It will make sure to format the event name properly for the given stat home.
	 *
	 * Tracks: Will be prefixed by 'jetpack_idc_' and use underscores.
	 * MC: Will not be prefixed, and will use dashes.
	 *
	 * @param eventName string
	 */
	function trackAndBumpMCStats( eventName ) {
		if ( 'undefined' !== eventName && eventName.length ) {

			// Format for Tracks
			eventName = eventName.replace( /-/g, '_' );
			eventName = eventName.indexOf( 'jetpack_idc_' ) !== 0 ? 'jetpack_idc_' + eventName : eventName;
			analytics.tracks.recordEvent( eventName, {} );

			// Now format for MC stats
			eventName = eventName.replace( 'jetpack_idc_', '' );
			eventName = eventName.replace( /_/g, '-' );
			analytics.mc.bumpStat( 'jetpack-idc', eventName );
		}
	}
})( jQuery );
