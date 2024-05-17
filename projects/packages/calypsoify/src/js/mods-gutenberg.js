import '../scss/style-gutenberg.scss';
import { dispatch, select } from '@wordpress/data';

// Force fullscreen mode for iframed post editor.
if (
	select( 'core/edit-post' ) &&
	! select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
) {
	dispatch( 'core/edit-post' ).toggleFeature( 'fullscreenMode' );
}

document.addEventListener( 'DOMContentLoaded', function () {
	document.querySelectorAll( 'body.revision-php a' ).forEach( function ( node ) {
		const href = node.getAttribute( 'href' );
		if ( href ) {
			node.setAttribute( 'href', href.replace( '&classic-editor', '' ) );
		}
	} );
} );
