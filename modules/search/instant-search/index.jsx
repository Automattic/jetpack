/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
import { getSearchQuery, getFilterQuery } from './lib/query-string';
import { getThemeOptions } from './lib/dom';

const injectSearchApp = grabFocus => {
	render(
		<SearchApp
			grabFocus={ grabFocus }
			initialFilters={ getFilterQuery() }
			initialValue={ getSearchQuery() }
			options={ window.JetpackInstantSearchOptions }
			themeOptions={ getThemeOptions( window.JetpackInstantSearchOptions ) }
		/>,
		document.body
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if (
		!! window.JetpackInstantSearchOptions &&
		'siteId' in window.JetpackInstantSearchOptions &&
		document.body.classList.contains( 'search' )
	) {
		injectSearchApp( getSearchQuery() );
	}
} );
