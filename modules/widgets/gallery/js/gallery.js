( function( $ ) {
	// Fixes a bug with carousels being triggered even when a widget's Link To option is not set to carousel.
	// Happens when another gallery is loaded on the page, either in a post or separate widget
	$( 'body' ).on( 'click', '.widget-gallery .no-carousel .tiled-gallery-item a', function( event ) {
		// Have to trigger default, instead of carousel
		event.stopPropagation();

		return true;
	} );
} )( jQuery );
