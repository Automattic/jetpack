/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */
( function ( $ ) {
	$( function () {
		$( '.zerobscrm-notice' ).on( 'click', '.notice-dismiss', function () {
			const $notice = $( this ).parent( '.notice.is-dismissible' );
			const dismiss_url = $notice.attr( 'data-dismiss-url' );
			if ( dismiss_url ) {
				$.get( dismiss_url );
			}
		} );
	} );
} )( jQuery );
