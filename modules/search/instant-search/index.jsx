/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from './components/search-widget';
import { buildFilterAggregations } from './lib/api';
import { getSearchQuery } from './lib/query-string';

const injectSearchWidget = ( initialValue, grabFocus ) => {
	render(
		<SearchWidget
			aggregations={ buildFilterAggregations( window.JetpackInstantSearchOptions.widgets ) }
			grabFocus={ grabFocus }
			initialValue={ initialValue }
			postTypes={ window.JetpackInstantSearchOptions.postTypes }
			siteId={ window.JetpackInstantSearchOptions.siteId }
			widgets={ window.JetpackInstantSearchOptions.widgets }
		/>,
		document.body
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if (
		!! window.JetpackInstantSearchOptions &&
		'postTypes' in window.JetpackInstantSearchOptions &&
		'siteId' in window.JetpackInstantSearchOptions &&
		'widgets' in window.JetpackInstantSearchOptions &&
		window.JetpackInstantSearchOptions.widgets.length > 0
	) {
		injectSearchWidget( getSearchQuery() );
	}
} );
