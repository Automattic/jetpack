/* eslint-disable no-var */
/* global wp, calypsoifyGutenberg */

jQuery( function( $ ) {
	if (
		wp &&
		wp.data &&
		wp.data.select &&
		! wp.data.select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
	) {
		wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'fullscreenMode' );
	}

	var editPostHeaderInception = setInterval( function() {
		var $closeButton = $( '.edit-post-fullscreen-mode-close__toolbar a' );
		if ( $closeButton.length < 1 ) {
			return;
		}
		clearInterval( editPostHeaderInception );

		$closeButton.attr( 'href', calypsoifyGutenberg.closeUrl );
	} );

	$( 'body.revision-php a' ).each( function() {
		var href = $( this ).attr( 'href' );
		$( this ).attr( 'href', href.replace( '&classic-editor', '' ) );
	} );
} );
