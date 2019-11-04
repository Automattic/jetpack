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

const injectSearchApp = grabFocus => {
	render(
		<SearchApp
			aggregations={ buildFilterAggregations( window[ SERVER_OBJECT_NAME ].widgets ) }
			grabFocus={ grabFocus }
			initialHref={ window.location.href }
			initialSort={ determineDefaultSort( window[ SERVER_OBJECT_NAME ].sort, getSearchQuery() ) }
			isSearchPage={ getSearchQuery() !== '' }
			options={ window[ SERVER_OBJECT_NAME ] }
			themeOptions={ getThemeOptions( window[ SERVER_OBJECT_NAME ] ) }
		/>,
		document.body
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if ( !! window[ SERVER_OBJECT_NAME ] && 'siteId' in window[ SERVER_OBJECT_NAME ] ) {
		initializeTracks();
		resetTrackingCookies();
		identifySite( window[ SERVER_OBJECT_NAME ].siteId );
		injectSearchApp();
	}
} );
