/* global idcL10n, jQuery */

( function( $ ) {
	var restNonce = idcL10n.nonce,
		restRoot = idcL10n.apiRoot,
		notice = $( '.jp-idc-notice' ),
		idcButtons = $( '.jp-idc-notice .dops-button' );

	// Confirm Safe Mode
	$( '#jp-idc-confirm-safe-mode-action' ).click( function() {
		confirmSafeMode();
	} );

	// Confirm Safe Mode
	$( '#jp-idc-fix-connection-action' ).click( function() {
		fixJetpackConnection();
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
})( jQuery );
