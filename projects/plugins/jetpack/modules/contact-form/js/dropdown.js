jQuery( function ( $ ) {
	$( document ).ready( function () {
		$( '.contact-form .jetpack-select' ).selectmenu( {
			classes: {
				'ui-selectmenu-button': 'contact-form-dropdown__button',
				'ui-selectmenu-menu': 'contact-form-dropdown__menu',
			},
		} );
	} );
} );
