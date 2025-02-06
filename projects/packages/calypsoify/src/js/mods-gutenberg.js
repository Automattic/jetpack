import '../scss/style-gutenberg.scss';
import { dispatch, select } from '@wordpress/data';

// Force fullscreen mode for iframed post editor.
if (
	select( 'core/edit-post' ) &&
	! select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
) {
	dispatch( 'core/edit-post' ).toggleFeature( 'fullscreenMode' );
}
