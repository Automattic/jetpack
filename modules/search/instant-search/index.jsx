/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
import { getSearchQuery, getFilterQuery, determineDefaultSort } from './lib/query-string';
import { getThemeOptions } from './lib/dom';
import { SERVER_OBJECT_NAME } from './lib/constants';
import { initializeTracks, identifyUser, identifySite } from './lib/tracks';

const injectSearchApp = grabFocus => {
	render(
		<SearchApp
			grabFocus={ grabFocus }
			initialFilters={ getFilterQuery() }
			initialValue={ getSearchQuery() }
			initialSort={ determineDefaultSort( window[ SERVER_OBJECT_NAME ].sort ) }
			options={ window[ SERVER_OBJECT_NAME ] }
			themeOptions={ getThemeOptions( window[ SERVER_OBJECT_NAME ] ) }
		/>,
		document.body
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if ( !! window[ SERVER_OBJECT_NAME ] && 'siteId' in window[ SERVER_OBJECT_NAME ] ) {
		initializeTracks();

		if ( 'userid' in window[ SERVER_OBJECT_NAME ] && 'username' in window[ SERVER_OBJECT_NAME ] ) {
			const { siteId, userid, username } = window[ SERVER_OBJECT_NAME ];
			identifyUser( userid, username );
			identifySite( siteId );
		}

		injectSearchApp();
	}
} );
