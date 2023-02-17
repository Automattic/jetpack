import domReady from '@wordpress/dom-ready';
import './style.scss';
import './map-marker/style.scss';
import { MapBoxBlock, MapkitBlock } from './sources/';

domReady( function () {
	Array.from( document.querySelectorAll( '.wp-block-jetpack-map' ) ).forEach( async blockRoot => {
		try {
			if ( blockRoot.getAttribute( 'data-source' ) === 'mapkit' ) {
				const block = new MapkitBlock( blockRoot );
				block.init();
			} else {
				const block = new MapBoxBlock( blockRoot );
				block.init();
			}
		} catch ( e ) {
			// Ignore error.
		}
	} );
} );
