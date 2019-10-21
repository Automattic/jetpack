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
import { initializeTracks, identifySite } from './lib/tracks';

// Must be the first import
if ( process.env.NODE_ENV === 'development' ) {
	require( 'preact/debug' );
}

const injectSearchApp = grabFocus => {
	render(
		<SearchApp
			grabFocus={ grabFocus }
			initialPath={ window[ SERVER_OBJECT_NAME ].siteUrl }
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
		identifySite( window[ SERVER_OBJECT_NAME ].siteId );
		injectSearchApp();
	}
} );
