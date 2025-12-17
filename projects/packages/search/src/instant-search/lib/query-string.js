import { encode } from 'qss';
import { decode } from '../external/query-string-decode';
import { SERVER_OBJECT_NAME, VALID_RESULT_FORMAT_KEYS } from './constants';
import { getFilterKeys, getStaticFilterKeys } from './filters';

/**
 * Parses the address bar's query string into an object.
 *
 * @param {string} search - raw query string prepended with '?'
 * @return {object} queryObject - a query object.
 */
export function getQuery( search = window.location.search ) {
	return decode( search.substring( 1 ), false, false );
}

/**
 * Change the query string.
 *
 * @param {object|null} queryObject - a query object.
 */
export function setQuery( queryObject ) {
	if ( window.instantSearchSkipPushState ) {
		return;
	}
	pushQueryString( encode( queryObject ) );
}

/**
 * Updates the browser's query string via an encoded query string.
 *
 * @param {string} queryString - an encoded query string.
 */
function pushQueryString( queryString ) {
	if ( history.pushState ) {
		// Build the target URL directly to avoid Safari tracking protection blocking
		// the pattern of creating a URL object and modifying its href property
		let baseUrl = window.location.origin + window.location.pathname;

		if ( window[ SERVER_OBJECT_NAME ] && 'homeUrl' in window[ SERVER_OBJECT_NAME ] ) {
			try {
				const homeUrl = window[ SERVER_OBJECT_NAME ].homeUrl;
				const parsedHomeUrl = new window.URL( homeUrl, window.location.origin );
				baseUrl = parsedHomeUrl.origin + parsedHomeUrl.pathname;
			} catch ( error ) {
				// Fallback to current location if homeUrl is invalid
				// eslint-disable-next-line no-console
				console.warn( 'Invalid homeUrl, using current location', error );
			}
		}

		const finalUrl = baseUrl + ( queryString ? '?' + queryString : '' );
		window.history.pushState( null, null, finalUrl );
	}
}

/**
 * Returns a result format value from the query string. Used to override the site's configured result format.
 *
 * @return {null|string} resultFormatQuery
 */
export function getResultFormatQuery() {
	const query = getQuery();

	if ( ! VALID_RESULT_FORMAT_KEYS.includes( query.result_format ) ) {
		return null;
	}

	return query.result_format;
}

/**
 * Navigates the window to a specified location with all search-related query values stirpped out.
 *
 * @param {string}   initialHref  - Target location to navigate to via push/replaceState.
 * @param {Function} callback     - Callback to be invoked if initialHref didn't include any search queries.
 * @param {boolean}  replaceState - Flag to toggle replaceState or pushState invocation. Useful if this function's being invoked due to history navigation.
 */
export function restorePreviousHref( initialHref, callback, replaceState = false ) {
	if ( history.pushState && history.replaceState ) {
		// Parse the initial URL to extract components
		const parsedUrl = new URL( initialHref );
		const queryObject = getQuery( parsedUrl.search );
		const keys = [ ...getFilterKeys(), ...getStaticFilterKeys(), 's', 'sort' ];

		// If initialHref has search or filter query values, clear them.
		const initialHasSearchQueries = Object.keys( queryObject ).some( key => keys.includes( key ) );
		if ( initialHasSearchQueries ) {
			keys.forEach( key => delete queryObject[ key ] );
		}

		// Build the final URL directly to avoid Safari tracking protection issues
		const queryString = encode( queryObject );
		const finalUrl =
			parsedUrl.origin +
			parsedUrl.pathname +
			( queryString ? '?' + queryString : '' ) +
			parsedUrl.hash;

		replaceState
			? window.history.replaceState( null, null, finalUrl )
			: window.history.pushState( null, null, finalUrl );

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
