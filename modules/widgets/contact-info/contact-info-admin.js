( function( $ ) {
	$( document ).on( 'change', '.jp-contact-info-showmap', function() {
		var $checkbox = $( this ),
			isChecked = $checkbox.is( ':checked' );

		$checkbox
			.closest( '.widget' )
			.find( '.jp-contact-info-admin-map' )
			.toggle( isChecked );
	} );
} )( window.jQuery );
