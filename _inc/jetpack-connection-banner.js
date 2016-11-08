/* jQuery */

( function( $ ) {
	var nav = $( '.jp-wpcom-connect__vertical-nav-container' ),
		contentContainer = $( '.jp-wpcom-connect__content-container' ),
		nextFeatureButtons = $( '.jp-banner__button-container .next-feature' );

	nav.on( 'click', '.vertical-menu__feature-item:not( .vertical-menu__feature-item-is-selected )', function() {
		transitionSlideToIndex( $( this ).index() );
	} );

	nextFeatureButtons.on( 'click', function() {
		var slideIndex = $( this )
			.closest( '.jp-wpcom-connect__slide' )
			.index();

		transitionSlideToIndex( slideIndex + 1 );
	} );

	function transitionSlideToIndex( index ) {
		// Remove classes from previously selected menu item and content
		nav
			.find( '.vertical-menu__feature-item-is-selected' )
			.removeClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer
			.find( '.jp__slide-is-active' )
			.removeClass( 'jp__slide-is-active' );

		// Add classes to selected menu item and content
		nav
			.children()
			.eq( index )
			.addClass( 'vertical-menu__feature-item-is-selected' );

		contentContainer
			.children()
			.eq( index )
			.addClass( 'jp__slide-is-active' );
	}
})( jQuery );
