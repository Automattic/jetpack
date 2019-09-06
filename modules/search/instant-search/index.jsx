/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from './components/search-widget';
import { getSearchQuery, getSearchSort } from './lib/query-string';

const injectSearchWidget = ( initialSearch, initialSort, grabFocus ) => {
	render(
		<SearchWidget
			grabFocus={ grabFocus }
			initialValue={ initialSearch }
			initialSort={ initialSort }
			options={ window.JetpackInstantSearchOptions }
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
		injectSearchWidget( getSearchQuery(), getSearchSort() );
	}
} );
