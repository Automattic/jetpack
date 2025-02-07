jQuery( function ( $ ) {
	const $input = $( '.contact-form input.jp-contact-form-date' );
	$input.each( function () {
		const el = $( this );
		const dateFormat = el.attr( 'data-format' ) || 'yy-mm-dd';
		el.datepicker( {
			dateFormat,
			constrainInput: false,
			showOptions: { direction: 'down' },
			onSelect: function () {
				$( this ).focus();
			},
		} );
	} );
} );
