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

function removeChildren( htmlElement ) {
	while ( htmlElement.lastChild ) {
		htmlElement.removeChild( htmlElement.lastChild );
	}
}

const hideSearchHeader = () => {
	const titleElements = document.getElementById( 'content' ).getElementsByClassName( 'page-title' );
	if ( titleElements.length > 0 ) {
		titleElements[ 0 ].style.display = 'none';
	}
};

const injectSearchWidget = ( initialValue, target, grabFocus ) => {
	render(
		<SearchWidget
			initialValue={ initialValue }
			grabFocus={ grabFocus }
			siteId={ window.JetpackInstantSearchOptions.siteId }
			filterConfig={ jetpack_instant_search_filters }
		/>,
		target
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if (
		'siteId' in window.JetpackInstantSearchOptions &&
		document.body &&
		document.body.classList.contains( 'search' )
	) {
		const element = document.getElementsByTagName( 'main' ).namedItem( 'main' );
		if ( !! element ) {
			removeChildren( element );
			hideSearchHeader();
			injectSearchWidget( getSearchQuery(), element );
		}
	}
} );
