jQuery( function ( $ ) {
	$( document ).ready( function () {
		initializeSelectMenu();

		const observer = new MutationObserver( () => {
			initializeSelectMenu();
		} );

		observer.observe( document.querySelector( 'body' ), {
			childList: true,
			subtree: true,
		} );
	} );

	function initializeSelectMenu() {
		$( '.contact-form .contact-form-dropdown' ).each( function () {
			const $select = $( this );
			const labelId = $select.data( 'contact-form-label-id' );

			$select
				.selectmenu( {
					classes: {
						'ui-selectmenu-button': 'contact-form-dropdown__button',
						'ui-selectmenu-menu': 'contact-form-dropdown__menu',
					},
				} )
				.attr( 'aria-hidden', true )
				.prop( 'tabindex', -1 )
				.selectmenu( 'widget' )
				.attr( 'aria-labelledby', labelId );
		} );
	}
} );
