/**
 * External dependencies
 */
import fetch from 'unfetch';

const FIELDS = [ 'title_html', 'author', 'permalink.url.raw' ];

/**
 * @preserve jquery-param (c) 2015 KNOWLEDGECODE | MIT
 * From https://github.com/knowledgecode/jquery-param
 */
function query_params( a ) {
	var s = [];
	var add = function( k, v ) {
		v = typeof v === 'function' ? v() : v;
		v = v === null ? '' : v === undefined ? '' : v;
		s[ s.length ] = encodeURIComponent( k ) + '=' + encodeURIComponent( v );
	};
	var buildParams = function( prefix, obj ) {
		var i, len, key;

		if ( prefix ) {
			if ( Array.isArray( obj ) ) {
				for ( i = 0, len = obj.length; i < len; i++ ) {
					buildParams(
						prefix + '[' + ( typeof obj[ i ] === 'object' && obj[ i ] ? i : '' ) + ']',
						obj[ i ]
					);
				}
			} else if ( String( obj ) === '[object Object]' ) {
				for ( key in obj ) {
					buildParams( prefix + '[' + key + ']', obj[ key ] );
				}
			} else {
				add( prefix, obj );
			}
		} else if ( Array.isArray( obj ) ) {
			for ( i = 0, len = obj.length; i < len; i++ ) {
				add( obj[ i ].name, obj[ i ].value );
			}
		} else {
			for ( key in obj ) {
				buildParams( key, obj[ key ] );
			}
		}
		return s;
	};
	return buildParams( '', a ).join( '&' );
}

function stringifyArray( fieldName, array ) {
	return array.map( ( element, index ) => `${ fieldName }[${ index }]=${ element }` ).join( '&' );
}

function getAPIUrl( siteId, query, aggs ) {
	var obj = {
		query: query,
		fields: FIELDS,
		aggregations: aggs,
	};
	return (
		`https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?` + query_params( obj )
	);
}

export function search( siteId, query, aggs ) {
	return fetch( getAPIUrl( siteId, query, aggs ) );
}
