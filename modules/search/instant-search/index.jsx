/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
import { getSearchQuery, determineDefaultSort } from './lib/query-string';
import { getThemeOptions } from './lib/dom';
import { SERVER_OBJECT_NAME } from './lib/constants';
import { initializeTracks, identifySite, resetTrackingCookies } from './lib/tracks';
import { buildFilterAggregations } from './lib/api';
import { bindCustomizerChanges } from './lib/customize';

const injectSearchApp = () => {
	render(
		<SearchApp
			aggregations={ buildFilterAggregations( [
				...window[ SERVER_OBJECT_NAME ].widgets,
				...window[ SERVER_OBJECT_NAME ].widgetsOutsideOverlay,
			] ) }
			hasOverlayWidgets={ !! window[ SERVER_OBJECT_NAME ].hasOverlayWidgets }
			initialHref={ window.location.href }
			initialOverlayOptions={ window[ SERVER_OBJECT_NAME ].overlayOptions }
			// NOTE: initialShowResults is only used in the customizer. See lib/customize.js.
			initialShowResults={ window[ SERVER_OBJECT_NAME ].showResults }
			initialSort={ determineDefaultSort( window[ SERVER_OBJECT_NAME ].defaultSort ) }
			isSearchPage={ getSearchQuery() !== '' }
			options={ window[ SERVER_OBJECT_NAME ] }
			themeOptions={ getThemeOptions( window[ SERVER_OBJECT_NAME ] ) }
		/>,
		document.body
	);
};

if ( window[ SERVER_OBJECT_NAME ] ) {
	bindCustomizerChanges();
}
document.addEventListener( 'DOMContentLoaded', function() {
	if ( !! window[ SERVER_OBJECT_NAME ] && 'siteId' in window[ SERVER_OBJECT_NAME ] ) {
		initializeTracks();
		resetTrackingCookies();
		identifySite( window[ SERVER_OBJECT_NAME ].siteId );
		injectSearchApp();
	}
} );
