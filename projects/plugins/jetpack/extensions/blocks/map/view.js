import domReady from '@wordpress/dom-ready';
import './style.scss';
import './component/map-marker/style.scss';
import { MapBoxBlock, MapkitBlock } from './view/';

domReady( function () {
	Array.from( document.querySelectorAll( '.wp-block-jetpack-map' ) ).forEach( async blockRoot => {
		try {
			if ( blockRoot.getAttribute( 'data-map-provider' ) === 'mapkit' ) {
				const block = new MapkitBlock( blockRoot );
				block.onError = () => {
					// remove the mapkit container
					blockRoot.innerHtml = '';
					const fallback = new MapBoxBlock( blockRoot );
					fallback.init();
				};
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
