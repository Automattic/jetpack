/* global idcL10n, jQuery */

( function( $ ) {
	
	var restNonce = idcL10n.nonce,
		restRoot = idcL10n.apiRoot;

	// Confirm Safe Mode
	$( '#idc-confirm-safe-mode' ).click( function() {
		confirmSafeMode();
	} );

	// Confirm Safe Mode
	$( '#idc-fix-connection' ).click( function() {
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
				$( '.jp-idc' ).hide();
				alert( JSON.stringify( response, null, 4 ) );
			},
			error: function( response ) {
				console.log( response.responseText );
			}
		} );
	}

	function fixJetpackConnection() {
		var route = restRoot + 'jetpack/v4/site';
		$.ajax( {
			method: 'GET',
			beforeSend : function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', restNonce );
			},
			url: route,
			data: {},
			success: function( response ){
				alert( JSON.stringify( response, null, 4 ) );
			},
			error: function( response ) {
				console.log( response.responseText );
			}
		} );
	}
})( jQuery );
