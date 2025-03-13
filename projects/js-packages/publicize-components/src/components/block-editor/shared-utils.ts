/**
 * This file contains the utility functions that are shared between Jetpack and Social sidebar entrypoints
 */
import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { store as interfaceStore } from '@wordpress/interface';

export class JetpackSidebarManager {
	url: URL;

	queryArg = 'jetpack-sidebar';

	jetpackSidebar = 'jetpack-sidebar/jetpack';

	socialSidebar = 'jetpack-social/jetpack-social';

	constructor() {
		this.url = new URL( window.location.href );
	}

	/**
	 * Remove the query arg from the URL
	 */
	removeQueryArg() {
		this.url.searchParams.delete( this.queryArg );
		window.history.replaceState( null, '', this.url.toString() );
	}

	/**
	 * Get the query arg from the URL
	 *
	 * @return The query arg value
	 */
	getQueryArg() {
		return this.url.searchParams.get( this.queryArg );
	}

	/**
	 * Check if the URL has the query arg
	 *
	 * @return Whether the URL has the query arg
	 */
	hasQueryArg() {
		return this.url.searchParams.has( this.queryArg );
	}

	/**
	 * Open Jetpack sidebar by default when URL includes jetpack-sidebar query arg
	 *
	 * @param sidebar - The sidebar to open
	 */
	mayBeOpenSidebar( sidebar: 'jetpack' | 'social' ) {
		domReady( () => {
			if ( this.hasQueryArg() ) {
				const area = sidebar === 'jetpack' ? this.jetpackSidebar : this.socialSidebar;

				const { enableComplementaryArea } = dispatch( interfaceStore ) as {
					enableComplementaryArea: ( scope: string, _area: string ) => void;
				};

				enableComplementaryArea( 'core', area );
			}
		} );
	}

	/**
	 * Remove the share post query arg from the URL if present.
	 */
	mayBeRemoveQueryArg() {
		if ( this.hasQueryArg() ) {
			this.removeQueryArg();
		}
	}
}
