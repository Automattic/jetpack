/* global idcL10n, jQuery, analytics, history */

( function( $ ) {
	var restNonce = idcL10n.nonce,
		currentUrl = idcL10n.currentUrl,
		restRoot = idcL10n.apiRoot,
		notice = $( '.jp-idc-notice' ),
		idcButtons = $( '.jp-idc-notice .dops-button' ),
		tracksUser = idcL10n.tracksUserData,
		adminBarMenu = $( '#wp-admin-bar-jetpack-idc' ),
		confirmSafeModeButton = $( '#jp-idc-confirm-safe-mode-action' );

	// Initialize Tracks and bump stats.
	analytics.initialize( tracksUser.userid, tracksUser.username );
	trackAndBumpMCStats( 'notice_view' );
	clearConfirmationArgsFromUrl();

	// Confirm Safe Mode
	confirmSafeModeButton.click( function() {
		trackAndBumpMCStats( 'confirm_safe_mode' );
		confirmSafeMode();
	} );

	// Fix connection
	$( '#jp-idc-fix-connection-action' ).click( function() {
		trackAndBumpMCStats( 'fix_connection' );
		fixJetpackConnection();
	} );

	function disableDopsButtons() {
		idcButtons.prop( 'disabled', true );
	}

	function enableDopsButtons() {
		idcButtons.prop( 'disabled', false );
	}

	function clearConfirmationArgsFromUrl( allowReload ) {
		allowReload = 'undefined' === typeof allowReload ? false : allowReload;

		// If the jetpack_idc_clear_confirmation query arg is present, let's try to clear it.
		//
		// Otherwise, there's a weird flow where if the user dismisses the notice, then shows the notice, then clicks
		// the confirm safe mode button again, and then reloads the page, then the notice never disappears.
		if ( window.location.search && -1 !== window.location.search.indexOf( 'jetpack_idc_clear_confirmation' ) ) {

			// If push state is available, let's use that to minimize reloading the page.
			// Otherwise, we can clear the args by reloading the page.
			if ( history && history.pushState ) {
				history.pushState( {}, '', currentUrl );
			} else if ( allowReload ) {
				window.location.href = currentUrl;
			}
		}
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
			success: function() {
				$( '.jp-idc-notice' ).hide();
				adminBarMenu.removeClass( 'hide' );
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
