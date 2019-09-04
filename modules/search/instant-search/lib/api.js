/**
 * External dependencies
 */
import fetch from 'unfetch';
import { encode } from 'qss';
import { flatten } from 'q-flat';

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

function buildFilterObject( filterQuery ) {
	if ( ! filterQuery ) {
		return {};
	}

	const filter = { bool: { must: [] } };
	if ( Array.isArray( filterQuery.postTypes ) && filterQuery.postTypes.length > 0 ) {
		filterQuery.postTypes.forEach( postType => {
			filter.bool.must.push( { term: { post_type: postType } } );
		} );
	}
	return filter;
}

export function search( { aggregations, filter, query, resultFormat, siteId } ) {
	let fields = [];
	let highlight_fields = [];
	switch ( resultFormat ) {
		case 'engagement':
		case 'product':
		case 'minimal':
		default:
			highlight_fields = [ 'title', 'content', 'comments' ];
			fields = [ 'date', 'permalink.url.raw', 'tag.name.default', 'category.name.default' ];
	}

	const queryString = encode(
		flatten( {
			aggregations,
			fields,
			highlight_fields,
			filter: buildFilterObject( filter ),
			query: encodeURIComponent( query ),
		} )
	);

	return fetch(
		`https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?${ queryString }`
	);
}
