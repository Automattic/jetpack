/**
 * External dependencies
 */
import fetch from 'unfetch';
import { encode } from 'qss';
import { flatten } from 'q-flat';
import { sprintf } from '@wordpress/i18n';

const FIELDS = [
	'author',
	'comment_count',
	'date',
	'excerpt_html',
	'gravatar_url',
	'permalink.url.raw',
	'title_html',
];

export function buildFilterAggregations( widgets = [] ) {
	const aggregation = {};
	widgets.forEach( ( { filters: widgetFilters } ) =>
		widgetFilters.forEach( filter => {
			switch ( filter.type ) {
				case 'date_histogram': {
					const field = filter.field === 'post_date_gmt' ? 'date_gmt' : 'date';
					aggregation[ filter.filter_id ] = {
						date_histogram: { field, interval: filter.interval },
					};
					break;
				}
				case 'taxonomy': {
					let field = `taxonomy.${ filter.taxonomy }.slug`;
					if ( filter.taxonomy === 'post_tag' ) {
						field = 'tag.slug';
					} else if ( filter.type === 'category' ) {
						field = 'category.slug';
					}
					aggregation[ filter.filter_id ] = { terms: { field, size: filter.count } };
					break;
				}
				case 'post_type': {
					aggregation[ filter.filter_id ] = { terms: { field: filter.type, size: filter.count } };
					break;
				}
			}
		} )
	);
	return aggregation;
}

export function buildFilter( query_params = {} ) {
	if ( ! query_params ) {
		return null;
	}
	let filter = {
		bool: {
			must: [],
		},
	};
	let has_date = false;
	for ( let p in query_params ) {
		switch ( p ) {
			case 'post_type':
				filter.bool.must.push( {
					term: { post_type: query_params[ p ] },
				} );
				break;
			case 'year':
			case 'monthnum':
			case 'day':
				has_date = true;
				break;
			case 'post_tag':
				filter.bool.must.push( {
					term: { 'tag.slug': query_params[ p ] },
				} );
				break;
			case 'category':
				filter.bool.must.push( {
					term: { 'category.slug': query_params[ p ] },
				} );
				break;
			default:
				//assume this is a taxonomy for now
				tax_name = 'taxonomy.' + p + '.slug';
				filter.bool.must.push( {
					term: { tax_name: query_params[ p ] },
				} );
				break;
		}
	}

	if ( has_date ) {
		let date_start;
		let date_end;
		if ( query_params[ 'year' ] ) {
			if ( query_params[ 'monthnum' ] ) {
				// Padding
				const date_monthnum = sprintf( '%02d', query_params[ 'monthnum' ] );

				if ( query_params[ 'day' ] ) {
					// Padding
					const date_day = sprintf( '%02d', query_params[ 'day' ] );

					date_start = query_params[ 'year' ] + '-' + date_monthnum + '-' + date_day + ' 00:00:00';
					date_end = query_params[ 'year' ] + '-' + date_monthnum + '-' + date_day + ' 23:59:59';
				} else {
					const days_in_month = new Date(
						query_params[ 'year' ],
						query_params[ 'monthnum' ],
						14
					).getDate(); // 14 = middle of the month so no chance of DST issues

					date_start = query_params[ 'year' ] + '-' + date_monthnum + '-01 00:00:00';
					date_end =
						query_params[ 'year' ] + '-' + date_monthnum + '-' + days_in_month + ' 23:59:59';
				}
			} else {
				date_start = query_params[ 'year' ] + '-01-01 00:00:00';
				date_end = query_params[ 'year' ] + '-12-31 23:59:59';
			}

			filter.bool.must.push( {
				range: {
					field: 'date',
					gte: date_start,
					lte: date_end,
				},
			} );
		}
	}
	return filter;
}

function getAPIUrl( siteId, query, aggregations, filter ) {
	const queryString = encode(
		flatten( {
			aggregations,
			filter,
			fields: FIELDS,
			query: encodeURIComponent( query ),
		} )
	);

	return `https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?${ queryString }`;
}

export function search( siteId, query, aggregations, filter ) {
	return fetch( getAPIUrl( siteId, query, aggregations ) );
}
