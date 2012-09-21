/**
 * Handles toggling the main navigation menu for small screens.
 */
jQuery( document ).ready( function( $ ) {
	var $subsidiary = $( '#branding' ),
	    timeout = false;

	$.fn.smallMenu = function() {
		$subsidiary.find( '#access' ).addClass( 'main-small-navigation' );
		$subsidiary.find( '#access h3' ).removeClass( 'assistive-text' ).addClass( 'menu-label' );
		$subsidiary.find( '#access .menu-handle' ).addClass( 'menu-toggle' );

		$( '.menu-toggle' ).click( function() {
			$subsidiary.find( '.menu' ).toggle();
			$( this ).toggleClass( 'toggled-on' );
		} );
	};

	// Check viewport width on first load.
	if ( $( window ).width() < 4000 )
		$.fn.smallMenu();

	// Check viewport width when user resizes the browser window.
	$( window ).resize( function() {
		var browserWidth = $( window ).width();

		if ( false !== timeout )
			clearTimeout( timeout );

		timeout = setTimeout( function() {
			if ( browserWidth < 4000 ) {
				$.fn.smallMenu();
			} else {
				$subsidiary.find( '#access' ).removeClass( 'main-small-navigation' );
				$subsidiary.find( '#access h3' ).removeClass( 'menu-label' ).addClass( 'assistive-text' );
				$subsidiary.find( '#access .menu-handle' ).removeClass( 'menu-toggle' );
				$subsidiary.find( '.menu' ).removeAttr( 'style' );
			}
		}, 200 );
	} );
} );