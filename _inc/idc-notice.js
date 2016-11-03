/* global idcL10n, jQuery, alert, JSON, console */

( function( $ ) {
	var restNonce = idcL10n.nonce,
		restRoot = idcL10n.apiRoot,
		notice = $( '.jp-idc-notice' );

	// Confirm Safe Mode
	$( '#jp-idc-confirm-safe-mode-action' ).click( function() {
		confirmSafeMode();
	} );

	// Confirm Safe Mode
	$( '#jp-idc-fix-connection-action' ).click( function() {
		fixJetpackConnection();
	} );

	function confirmSafeMode() {
		var route = restRoot + 'jetpack/v4/site';
		$.ajax( {
			method: 'GET',
			beforeSend : function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', restNonce );
			},
			url: route,
			data: {},
			success: function( response ){
				$( '.jp-idc-notice' ).hide();
				alert( JSON.stringify( response, null, 4 ) );
			},
			error: function( response ) {
				console.log( response.responseText );
			}
		} );
	}

	function fixJetpackConnection() {
		notice.addClass( 'jp-idc-show-second-step' );
	}
})( jQuery );
