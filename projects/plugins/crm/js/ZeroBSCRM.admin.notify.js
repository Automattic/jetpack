/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */
( function ( $ ) {
	'use strict';
	$( function () {
		$( '.zerobscrm-notice' ).on( 'click', '.notice-dismiss', function ( event, el ) {
			var $notice = $( this ).parent( '.notice.is-dismissible' );
			var dismiss_url = $notice.attr( 'data-dismiss-url' );
			if ( dismiss_url ) {
				$.get( dismiss_url );
			}
		} );
	} );
} )( jQuery );
