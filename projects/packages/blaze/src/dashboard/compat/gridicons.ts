import { useEffect } from 'react';

const GRIDICONS_SPRITE =
	'https://widgets.wp.com/blaze-dashboard/common/gridicons-506499ddac13811fee8e.svg';
const SPRITE_ID = 'jetpack-blaze-gridicons-sprite';

/**
 * Inject the gridicons sprite the remote DSP widget's icons point at, once.
 */
export function useGridiconsSprite() {
	useEffect( () => {
		if ( document.getElementById( SPRITE_ID ) ) {
			return;
		}
		window
			.fetch( GRIDICONS_SPRITE )
			.then( response => ( response.ok ? response.text() : '' ) )
			.then( svg => {
				if ( ! svg || document.getElementById( SPRITE_ID ) ) {
					return;
				}
				const doc = new window.DOMParser().parseFromString( svg, 'image/svg+xml' );
				const sprite = doc.documentElement;
				if ( sprite.nodeName.toLowerCase() !== 'svg' ) {
					return;
				}
				sprite.setAttribute( 'id', SPRITE_ID );
				sprite.style.display = 'none';
				document.body.prepend( document.importNode( sprite, true ) );
			} )
			.catch( () => {} );
	}, [] );
}
