/* eslint-disable no-var */
/* global jQuery, wp, calypsoifyGutenberg */

jQuery( function ( $ ) {
	// Force fullscreen mode for iframed post editor.
	if (
		wp &&
		wp.data &&
		wp.data.select( 'core/edit-post' ) &&
		! wp.data.select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
	) {
		wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'fullscreenMode' );
	}

	// Force fullscreen mode for iframed site editor.
	if (
		wp &&
		wp.data &&
		wp.data.select( 'core/edit-site' ) &&
		! wp.data.select( 'core/edit-site' ).isFeatureActive( 'fullscreenMode' )
	) {
		wp.data.dispatch( 'core/edit-site' ).toggleFeature( 'fullscreenMode' );
	}

	var editPostHeaderInception = setInterval( function () {
		var $closeButton = $( '.edit-post-fullscreen-mode-close__toolbar a' );
		if ( $closeButton.length < 1 ) {
			return;
		}
		clearInterval( editPostHeaderInception );

		if ( calypsoifyGutenberg.closeUrl ) {
			$closeButton.attr( 'href', calypsoifyGutenberg.closeUrl );
			$closeButton.attr( 'target', '_parent' );
		}
	} );

	$( 'body.revision-php a' ).each( function () {
		var href = $( this ).attr( 'href' );
		if ( href ) {
			$( this ).attr( 'href', href.replace( '&classic-editor', '' ) );
		}
	} );
} );
