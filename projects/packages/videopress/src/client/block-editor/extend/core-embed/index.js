/**
 * External dependencies
 */
import { unregisterBlockVariation } from '@wordpress/blocks';
import domReady from '@wordpress/dom-ready';

domReady( function () {
	// @todo: horrible hack to make the unregister work
	setTimeout( () => {
		unregisterBlockVariation( 'core/embed', 'videopress' );
	}, 0 );
} );
