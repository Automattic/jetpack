( function( $ ) {
	$( '.milestone-type' ).on( 'change', function() {
		$( this ).parent().find( '.milestone-message' ).attr( 'disabled', $( this ).find( 'input[type="radio"]:checked' ).val() === 'since' )
	} );
} )( jQuery );
