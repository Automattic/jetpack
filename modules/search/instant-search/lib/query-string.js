/**
 * External dependencies
 */
import { decode, encode } from 'qss';

function getQuery() {
	return decode( window.location.search.substring( 1 ) );
}

function pushQueryString( queryString ) {
	if ( history.pushState ) {
		const newurl = `${ window.location.protocol }//${ window.location.host }${
			window.location.pathname
		}?${ queryString }`;
		window.history.pushState( { path: newurl }, '', newurl );
	}
}

export function getSearchQuery() {
	const query = getQuery();
	return 's' in query ? decodeURIComponent( query.s.replace( /\+/g, '%20' ) ) : '';
}

export function setSearchQuery( searchValue ) {
	const query = getQuery();
	query.s = searchValue;
	pushQueryString( encode( query ) );
}

function getFilterQueryByKey( filterKey ) {
	const query = getQuery();
	if ( ! ( filterKey in query ) ) {
		return [];
	}
	if ( typeof query[ filterKey ] === 'string' ) {
		return [ query[ filterKey ] ];
	}
	return query[ filterKey ];
}

export function getFilterQuery( filterKey ) {
	if ( filterKey ) {
		return getFilterQueryByKey( filterKey );
	}

	return {
		post_types: getFilterQueryByKey( 'post_types' ),
	};
}

export function setFilterQuery( filterKey, filterValue ) {
	const query = getQuery();
	query[ filterKey ] = filterValue;
	pushQueryString( encode( query ) );
}
