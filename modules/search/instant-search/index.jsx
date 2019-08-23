/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from './components/search-widget';
import { removeChildren } from './lib/dom';
import { getSearchQuery } from './lib/query-string';

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
			widgets={ window.JetpackInstantSearchOptions.widgets }
		/>,
		target
	);
};

document.addEventListener( 'DOMContentLoaded', function() {
	if (
		!! window.JetpackInstantSearchOptions &&
		'siteId' in window.JetpackInstantSearchOptions &&
		'widgets' in window.JetpackInstantSearchOptions &&
		document.body &&
		document.body.classList.contains( 'search' )
	) {
		const widget = document.querySelector( '.widget_search' );
		if ( !! widget ) {
			removeChildren( widget );
			removeChildren( document.querySelector( 'main' ) );
			hideSearchHeader();
			injectSearchWidget( getSearchQuery(), widget );
		}
	}
} );
