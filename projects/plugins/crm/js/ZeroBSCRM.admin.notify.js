/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.14+
 *
 * Copyright 2017+ ZeroBSCRM.com
 *
 * Date: 26/09/2017
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
