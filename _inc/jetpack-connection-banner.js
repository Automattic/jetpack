/* jQuery */

( function( $ ) {
	var nav = $( '.jp-wpcom-connect__vertical-nav-container' ),
		contentContainer = $( '.jp-wpcom-connect__content-container' ),
		nextFeatureButtons = $( '.jp-banner__button-container .next-feature' ),
		fullScreenContainer = $( '.jp-connect-full__container' ),
		fullScreenDismiss = $( '.jp-connect-full__dismiss' );

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

	/**
	 * Full-screen connection prompt
	 */
	fullScreenDismiss.on( 'click', function() {
		$( fullScreenContainer ).hide();

		// Re-enable scrolling
		$( 'body' ).css( 'overflow', 'visible' );
	} );

	$( document ).keyup( function( e ) {
		if ( 27 === e.keyCode ) {
			$( fullScreenDismiss ).click();
		}
	} );

	// Prevent scrolling if full-page prompt is showing
	if ( $( fullScreenContainer ).is( ':visible' ) ) {
		$( 'body' ).css( 'overflow', 'hidden' );
	}
} )( jQuery );
