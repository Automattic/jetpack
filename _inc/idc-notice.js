/* global idcL10n, jQuery, analytics, history, wpCookies */

( function( $ ) {
	var restNonce = idcL10n.nonce,
		currentUrl = idcL10n.currentUrl,
		restRoot = idcL10n.apiRoot,
		notice = $( '.jp-idc-notice' ),
		idcButtons = $( '.jp-idc-notice .dops-button' ),
		tracksUser = idcL10n.tracksUserData,
		tracksEvent = idcL10n.tracksEventData,
		adminBarMenu = $( '#wp-admin-bar-jetpack-idc' ),
		confirmSafeModeButton = $( '#jp-idc-confirm-safe-mode-action' ),
		fixConnectionButton = $( '#jp-idc-fix-connection-action' ),
		reconnectButton  = $( '#jp-idc-reconnect-site-action' ),
		migrateButton = $( '#jp-idc-migrate-action' );


	// Initialize Tracks and bump stats.
	analytics.initialize( tracksUser.userid, tracksUser.username );
	if ( tracksEvent.isAdmin ) {
		trackAndBumpMCStats( 'notice_view' )
	} else {
		trackAndBumpMCStats( 'non_admin_notice_view', { 'page': tracksEvent.currentScreen } );
	}
	clearConfirmationArgsFromUrl();

	// If the user dismisses the notice, set a cookie for one week so we don't display it for that time.
	notice.on( 'click.wp-dismiss-notice', function() {
		var secure = ( 'https:' === window.location.protocol );
		wpCookies.set( 'jetpack_idc_dismiss_notice', '1', 7 * 24 * 60 * 60, false, false, secure );
	} );

	// Confirm Safe Mode
	confirmSafeModeButton.click( function() {
		trackAndBumpMCStats( 'confirm_safe_mode' );
		confirmSafeMode();
	} );

	// Goes to second step of the notice.
	fixConnectionButton.click( function() {
		trackAndBumpMCStats( 'fix_connection' );
		fixJetpackConnection();
	} );

	// Starts process to create a new connection.
	reconnectButton.click( function() {
		trackAndBumpMCStats( 'start_fresh' );
		startFreshConnection();
	} );

	// Starts migration process.
	migrateButton.click( function() {
		trackAndBumpMCStats( 'migrate' );
		migrateStatsAndSubscribers();
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
			trackAndBumpMCStats( 'clear_confirmation_clicked' );

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
				notice.hide();
				adminBarMenu.removeClass( 'hide' );

				// We must refresh the Jetpack admin UI page in order for the React UI to render.
				if ( window.location.search && 1 === window.location.search.indexOf( 'page=jetpack' ) ) {
					window.location.reload();
				}
			},
			error: function() {
				enableDopsButtons();
			}
		} );
	}

	function migrateStatsAndSubscribers() {
		var route = restRoot + 'jetpack/v4/identity-crisis/migrate';
		disableDopsButtons();
		$.ajax( {
			method: 'POST',
			beforeSend : function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', restNonce );
			},
			url: route,
			data: {},
			success: function() {
				notice.hide();
				if ( $( 'body' ).hasClass( 'toplevel_page_jetpack' ) ) {
					// On the main Jetpack page, sites in IDC will not see Jetpack's interface.
					// Once IDC is resolved, we need to refresh the page to regain access to the UI.
					window.location.reload( true );
				}
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
	 * @param extraProps object
	 */
	function trackAndBumpMCStats( eventName, extraProps = {} ) {
		if ( 'undefined' !== eventName && eventName.length ) {

			// Format for Tracks
			eventName = eventName.replace( /-/g, '_' );
			eventName = eventName.indexOf( 'jetpack_idc_' ) !== 0 ? 'jetpack_idc_' + eventName : eventName;
			analytics.tracks.recordEvent( eventName, { extraProps } );

			// Now format for MC stats
			eventName = eventName.replace( 'jetpack_idc_', '' );
			eventName = eventName.replace( /_/g, '-' );
			analytics.mc.bumpStat( 'jetpack-idc', eventName );
		}
	}
})( jQuery );
