/**
 * External dependencies
 */
import fetch from 'unfetch';

/**
 * @preserve jquery-param (c) 2015 KNOWLEDGECODE | MIT
 * From https://github.com/knowledgecode/jquery-param
 */
function query_params( a ) {
	var s = [];
	const add = function( k, v ) {
		v = typeof v === 'function' ? v() : v;
		v = v === null ? '' : v === undefined ? '' : v;
		s[ s.length ] = encodeURIComponent( k ) + '=' + encodeURIComponent( v );
	};
	const buildParams = function( prefix, obj ) {
		let i, len, key;

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

export function search( siteId, query, aggs, filter, resultFormat ) {
	let fields = [];
	let highlight_fields = [];
	switch ( resultFormat ) {
		case 'engagement':
		case 'product':
		case 'minimal':
		default:
			highlight_fields = [ 'title', 'content', 'comments' ];
			fields = [
				'author',
				'comment_count',
				'date',
				'excerpt_html',
				'gravatar_url',
				'permalink.url.raw',
				'title_html',
			];
	}

	const obj = {
		query: query,
		fields: fields,
		highlight_fields: highlight_fields,
		aggregations: aggs,
		filter: filter,
	};
	return fetch(
		`https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?` + query_params( obj )
	);
}
