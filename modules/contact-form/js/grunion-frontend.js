jQuery( function ( $ ) {
	if ( 'function' === typeof $.fn.datepicker ) {
		$( '.contact-form input[type="date"]' ).datepicker( { dateFormat : 'yy-mm-dd' } );
	}
} );