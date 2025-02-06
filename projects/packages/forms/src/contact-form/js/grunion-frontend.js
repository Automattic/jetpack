jQuery( function ( $ ) {
	const $input = $( '.contact-form input.jp-contact-form-date' );
	const dateFormat = $input.attr( 'data-format' ) || 'yy-mm-dd';

	$input.datepicker( {
		dateFormat,
		constrainInput: false,
		showOptions: { direction: 'down' },
		onSelect: function () {
			$( this ).focus();
		},
	} );
} );
