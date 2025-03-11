/**
 * This file contains the utility functions that are shared between Jetpack and Social sidebar entrypoints
 */
import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { store as interfaceStore } from '@wordpress/interface';
import { getQueryArg } from '@wordpress/url';

const JETPACK_SIDEBAR_OPTIONS = [ 'open', 'open_with_share_post' ];

/**
 * Open Jetpack sidebar by default when URL includes jetpackSidebar query arg
 *
 * @param sidebar - The sidebar to open
 */
export function mayBeOpenSidebar( sidebar: 'jetpack' | 'social' ) {
	domReady( () => {
		const value = getQueryArg( window.location.search, 'jetpackSidebar' ) as string;

		if ( value && JETPACK_SIDEBAR_OPTIONS.includes( value ) ) {
			const area =
				sidebar === 'jetpack' ? 'jetpack-sidebar/jetpack' : 'jetpack-social/jetpack-social';

			dispatch( interfaceStore ).enableComplementaryArea( 'core', area );
		}
	} );
}
