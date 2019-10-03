/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from './components/search-widget';
import { getSearchQuery, getFilterQuery, getSortQuery } from './lib/query-string';
import { SERVER_OBJECT_NAME } from './lib/constants';

const injectSearchWidget = grabFocus => {
	render(
		<SearchWidget
			grabFocus={ grabFocus }
			initialFilters={ getFilterQuery() }
			initialSort={ getSortQuery() }
			initialValue={ getSearchQuery() }
			options={ window[ SERVER_OBJECT_NAME ] }
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
		injectSearchWidget();
	}
} );
