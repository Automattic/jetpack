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

export function getQuery() {
	return decode( window.location.search.substring( 1 ), false, false );
}

/**
 * Updates the browser's query string.
 *
 * @param {object} queryObject - a query object.
 */
export function setQuery( queryObject ) {
	pushQueryString( encode( queryObject ) );
}

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

export function restorePreviousHref( initialHref, callback ) {
	if ( history.pushState ) {
		window.history.pushState( null, null, initialHref );

		const query = getQuery();
		const keys = [ ...getFilterKeys(), 's', 'sort' ];
		// If initialHref has search or filter query values, clear them and reload.
		if ( Object.keys( query ).some( key => keys.includes( key ) ) ) {
			keys.forEach( key => delete query[ key ] );
			pushQueryString( encode( query ) );
			window.location.reload();
			return;
		}

		// Otherwise, invoke the callback
		callback();
	}
}
