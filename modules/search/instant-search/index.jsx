/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
import { getSearchQuery, getFilterQuery, getSortQuery } from './lib/query-string';
import { getThemeOptions } from './lib/dom';
import { SERVER_OBJECT_NAME } from './lib/constants';

const injectSearchApp = grabFocus => {
	render(
		<SearchApp
			grabFocus={ grabFocus }
			initialFilters={ getFilterQuery() }
			initialSort={ getSortQuery() }
			initialValue={ getSearchQuery() }
			options={ window[ SERVER_OBJECT_NAME ] }
			themeOptions={ getThemeOptions( window[ SERVER_OBJECT_NAME ] ) }
		/>,
		document.body
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if (
		!! window[ SERVER_OBJECT_NAME ] &&
		'siteId' in window[ SERVER_OBJECT_NAME ] &&
		document.body.classList.contains( 'search' )
	) {
		injectSearchApp();
	}
} );
