/**
 * This file contains the utility functions that are shared between Jetpack and Social sidebar entrypoints
 */
import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { store as interfaceStore } from '@wordpress/interface';
import { getQueryArg } from '@wordpress/url';

/**
 * Open Jetpack sidebar by default when URL includes jetpack-sidebar query arg
 *
 * @param sidebar - The sidebar to open
 */
export function mayBeOpenSidebar( sidebar: 'jetpack' | 'social' ) {
	domReady( () => {
		// If the URL has `jetpack-sidebar` query arg, open the Jetpack sidebar
		if ( getQueryArg( window.location.search, 'jetpack-sidebar' ) ) {
			const area =
				sidebar === 'jetpack' ? 'jetpack-sidebar/jetpack' : 'jetpack-social/jetpack-social';

			dispatch( interfaceStore ).enableComplementaryArea( 'core', area );
		}
	} );
}
