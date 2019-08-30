/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from './components/search-widget';
import { getSearchQuery } from './lib/query-string';

const injectSearchWidget = ( initialValue, grabFocus ) => {
	render(
		<SearchWidget
			grabFocus={ grabFocus }
			initialValue={ initialValue }
			options={ window.JetpackInstantSearchOptions }
		/>,
		document.body
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if ( !! window.JetpackInstantSearchOptions && 'siteId' in window.JetpackInstantSearchOptions ) {
		injectSearchWidget( getSearchQuery() );
	}
} );
