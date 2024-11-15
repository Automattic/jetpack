( function ( $ ) {
	// eslint-disable-next-line no-shadow
	$( document ).ready( function ( $ ) {
		$( '#customize-control-footercredit select' ).on( 'change', function () {
			const val = $( this ).val();
			const $upgrade = $( this ).parent().find( '.footercredit-upgrade-link' );
			if ( val === 'hidden-upgrade' ) {
				$upgrade.fadeIn();
			} else {
				$upgrade.fadeOut();
			}
		} );
	} );
} )( jQuery );
