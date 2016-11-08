/* jQuery */

( function( $ ) {
	var nav = $( '.jp-wpcom-connect__vertical-nav-container' ),
		contentContainer = $( '.jp-wpcom-connect__content-container' );

	nav.on( 'click', '.vertical-menu__feature-item:not( .vertical-menu__feature-item-is-selected )', function() {
		// Selected menu item index
		var selectedMenuItemIndex = $( this ).index();

		// Remove classes from previously selected menu item and content
		nav
			.find( '.vertical-menu__feature-item-is-selected' )
			.removeClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer
			.find( '.jp__slide-is-active' )
			.removeClass( 'jp__slide-is-active' );

		// Add classes to selected menu item and content
		$( this ).addClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer
			.children()
			.eq( selectedMenuItemIndex )
			.addClass( 'jp__slide-is-active' );
	} );
})( jQuery );