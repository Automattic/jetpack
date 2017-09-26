jQuery( function ( $ ) {
	var datefield = $( '.contact-form input[type="date"]' );
	if ( 'function' === typeof $.fn.datepicker && 'text' === datefield[0].type ) {
		datefield.datepicker( { dateFormat : 'yyyy-mm-dd' } );
	}
} );
