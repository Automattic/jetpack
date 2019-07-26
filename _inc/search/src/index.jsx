/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from '../components/search-widget';

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
	render( <SearchWidget initialValue={ initialValue } grabFocus={ grabFocus } />, target );
};

document.addEventListener( 'DOMContentLoaded', function() {
	if ( document.body && document.body.classList.contains( 'search' ) ) {
		const element = document.getElementsByTagName( 'main' ).namedItem( 'main' );
		if ( !! element ) {
			let initialValue = '';
			const existingSearch = document.getElementsByClassName( 'widget_search' );
			if ( existingSearch.length > 0 ) {
				const inputs = existingSearch[ 0 ].getElementsByTagName( 'input' );
				if ( inputs.length > 0 ) {
					initialValue = inputs[ 0 ].value;
				}
			}
			removeChildren( element );
			hideSearchHeader();
			injectSearchWidget( initialValue, element );
		}
	}
} );
