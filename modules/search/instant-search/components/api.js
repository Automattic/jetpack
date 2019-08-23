/**
 * External dependencies
 */
import fetch from 'unfetch';
import { encode } from 'qss';
import { flatten } from 'q-flat';

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

function getAPIUrl( siteId, query, widgets ) {
	const queryString = encode(
		flatten( {
			aggregations: buildFilterAggregations( widgets ),
			fields: FIELDS,
			query: encodeURIComponent( query ),
		} )
	);

	return `https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?${ queryString }`;
}

export function search( siteId, query, widgets ) {
	return fetch( getAPIUrl( siteId, query, widgets ) );
}
