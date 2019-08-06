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

export function buildAggs( filterConfig ) {
	var aggs = {};
	if ( filterConfig ) {
		let filters = filterConfig.filters;
		Object.keys( filters ).forEach( function( filterName ) {
			var filter = filters[ filterName ];
			switch ( filter.type ) {
				case 'date_histogram':
					var field = filter.field == 'post_date_gmt' ? 'date_gmt' : 'date';
					aggs[ filterName ] = {
						date_histogram: {
							field: field,
							interval: filter.interval,
						},
					};
					break;
				case 'taxonomy':
					var field = 'taxonomy.' + filter.taxonomy;
					switch ( filter.taxonomy ) {
						case 'post_tag':
							field = 'tag';
							break;
						case 'category':
							field = 'category';
							break;
					}
					field = field + '.slug';
					aggs[ filterName ] = {
						terms: {
							field: field,
							size: filter.count,
						},
					};
					break;
				case 'post_type':
					aggs[ filterName ] = {
						terms: {
							field: 'post_type',
							size: filter.count,
						},
					};
					break;
			}
		} );
	}
	return aggs;
}
