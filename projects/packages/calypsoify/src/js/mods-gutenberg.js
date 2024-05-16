/* eslint-disable no-var */
/* global calypsoifyGutenberg */
import '../scss/style-gutenberg.scss';
import { dispatch, select } from '@wordpress/data';

// Force fullscreen mode for iframed post editor.
if (
	select( 'core/edit-post' ) &&
	! select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
) {
	dispatch( 'core/edit-post' ).toggleFeature( 'fullscreenMode' );
}

// Force fullscreen mode for iframed site editor.
if (
	select( 'core/edit-site' ) &&
	! select( 'core/edit-site' ).isFeatureActive( 'fullscreenMode' )
) {
	dispatch( 'core/edit-site' ).toggleFeature( 'fullscreenMode' );
}

var editPostHeaderInception = setInterval( function () {
	var closeButton = document.querySelector( '.edit-post-fullscreen-mode-close__toolbar a' );
	if ( closeButton.length < 1 ) {
		return;
	}
	clearInterval( editPostHeaderInception );

	if ( calypsoifyGutenberg.closeUrl ) {
		closeButton.setAttribute( 'href', calypsoifyGutenberg.closeUrl );
		closeButton.setAttribute( 'target', '_parent' );
	}
} );

$( 'body.revision-php a' ).each( function () {
	var href = $( this ).getAttribute( 'href' );
	if ( href ) {
		$( this ).setAttribute( 'href', href.replace( '&classic-editor', '' ) );
	}
} );
