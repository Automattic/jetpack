/**
 * External dependencies
 */
import 'url-polyfill';
import { encode } from 'qss';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME, VALID_RESULT_FORMAT_KEYS } from './constants';
import { getFilterKeys } from './filters';
import { decode } from '../external/query-string-decode';

export function getQuery( search = window.location.search ) {
	return decode( search.substring( 1 ), false, false );
}

/**
 * Updates the browser's query string via a query object.
 *
 * @param {object} queryObject - a query object.
 */
export function setQuery( queryObject ) {
	pushQueryString( encode( queryObject ) );
}

/**
 * Updates the browser's query string via an encoded query string.
 *
 * @param {string} queryString - an encoded query string.
 */
function pushQueryString( queryString ) {
	if ( history.pushState ) {
		const url = new window.URL( window.location.href );
		if ( window[ SERVER_OBJECT_NAME ] && 'homeUrl' in window[ SERVER_OBJECT_NAME ] ) {
			url.href = window[ SERVER_OBJECT_NAME ].homeUrl;
		}
		url.search = queryString;
		window.history.pushState( null, null, url.toString() );
	}
}

export function getResultFormatQuery() {
	const query = getQuery();

	if ( ! VALID_RESULT_FORMAT_KEYS.includes( query.result_format ) ) {
		return null;
	}

	return query.result_format;
}

export function restorePreviousHref( initialHref, callback, replaceState = false ) {
	if ( history.pushState && history.replaceState ) {
		const url = new URL( initialHref );
		const queryObject = getQuery( url.search );
		const keys = [ ...getFilterKeys(), 's', 'sort' ];

		// If initialHref has search or filter query values, clear them.
		const initialHasSearchQueries = Object.keys( queryObject ).some( key => keys.includes( key ) );
		if ( initialHasSearchQueries ) {
			keys.forEach( key => delete queryObject[ key ] );
		}
		url.search = encode( queryObject );

		replaceState
			? window.history.replaceState( null, null, url.toString() )
			: window.history.pushState( null, null, url.toString() );

		// If initialHref had search queries, then the page rendered beneath the search modal is WordPress's default search page.
		// We want to strip these search queries from the URL and direct the user to the root if possible.
		if ( initialHasSearchQueries ) {
			window.location.reload();
			return;
		}

		// If we didn't need to reload the window, invoke the callback which is usually used for
		// React/Redux state transitions to reflect the newly set URL.
		callback();
	}
}
