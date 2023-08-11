( function ( $ ) {
	$( document ).ready( function () {
		$( '#wp-admin-bar-delete-cache' ).on( 'click', function () {
			$( '#wp-admin-bar-delete-cache' ).fadeOut( 'slow' );
			$.ajax( {
				type: 'post',
				dataType: 'json',
				url: wpsc_ajax.ajax_url,
				data: {
					// wp ajax action
					action: 'ajax-delete-cache',

					path: wpsc_ajax.path,
					admin: wpsc_ajax.admin,

					// send the nonce along with the request
					nonce: wpsc_ajax.nonce,
				},
				success: function ( msg ) {
					wpsc_ajax.admin == 1 && console.log( 'Deleted entire cache' );
					wpsc_ajax.admin == 0 && console.log( 'Deleted cache for this page and reloading' );
					window.location.reload();
				},
				complete: function ( msg ) {
					$( '#wp-admin-bar-delete-cache' ).fadeIn( 'slow' );
				},
			} );
			return false;
		} );
	} );
} )( jQuery );
