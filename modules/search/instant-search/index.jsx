/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchApp from './components/search-app';
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

const injectSearchApp = ( initialValue, target, grabFocus ) => {
	render(
		<SearchApp
			initialValue={ initialValue }
			grabFocus={ grabFocus }
			siteId={ window.JetpackInstantSearchOptions.siteId }
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
		const widget = document.querySelector( '.widget_search' );
		if ( !! widget ) {
			removeChildren( widget );
			removeChildren( document.querySelector( 'main' ) );
			hideSearchHeader();
			injectSearchApp( getSearchQuery(), widget );
		}
	}
} );
