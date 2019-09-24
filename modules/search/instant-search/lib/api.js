/**
 * External dependencies
 */
import fetch from 'unfetch';
import { encode } from 'qss';
import { flatten } from 'q-flat';

const isLengthyArray = array => Array.isArray( array ) && array.length > 0;

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

const DATE_REGEX = /(\d{4})-(\d{2})-(\d{2})/;
function generateDateRange( yearQuery, monthQuery, dayQuery ) {
	// NOTE: This only supports a single date query at this time
	const yearInput = Array.isArray( yearQuery ) && yearQuery[ 0 ];
	const monthInput = Array.isArray( monthQuery ) && monthQuery[ 0 ];
	const dayInput = Array.isArray( dayQuery ) && dayQuery[ 0 ];

	let year, month, day;
	if ( yearInput ) {
		[ , year, , ] = yearInput.match( DATE_REGEX );
	}

	if ( monthInput ) {
		if ( ! year ) {
			[ , year, month ] = monthInput.match( DATE_REGEX );
		} else {
			[ , , month ] = monthInput.match( DATE_REGEX );
		}
	}

	if ( dayInput ) {
		if ( ! year && ! month ) {
			[ , year, month, day ] = dayInput.match( DATE_REGEX );
		} else if ( ! year ) {
			[ , year, , day ] = dayInput.match( DATE_REGEX );
		} else if ( ! month ) {
			[ , , month, day ] = dayInput.match( DATE_REGEX );
		} else {
			[ , , , day ] = dayInput.match( DATE_REGEX );
		}
	}

	if ( day ) {
		return {
			startDate: `${ year }-${ month }-${ day }`,
			endDate: `${ year }-${ month }-${ +day + 1 }`,
		};
	}
	if ( month ) {
		return { startDate: `${ year }-${ month }-01`, endDate: `${ year }-${ +month + 1 }-01` };
	}
	if ( year ) {
		return { startDate: `${ year }-01-01`, endDate: `${ +year + 1 }-01-01` };
	}
	return { startDate: '', endDate: '' };
}

function buildFilterObject( filterQuery ) {
	if ( ! filterQuery ) {
		return {};
	}

	const filter = { bool: { must: [] } };
	if ( isLengthyArray( filterQuery.post_types ) ) {
		filterQuery.post_types.forEach( postType => {
			filter.bool.must.push( { term: { post_type: postType } } );
		} );
	}
	if ( isLengthyArray( filterQuery.post_tag ) ) {
		filterQuery.post_tag.forEach( tag => {
			filter.bool.must.push( { term: { 'tag.slug': tag } } );
		} );
	}
	if ( isLengthyArray( filterQuery.post_tag ) ) {
		filterQuery.post_tag.forEach( tag => {
			filter.bool.must.push( { term: { 'tag.slug': tag } } );
		} );
	}
	if (
		isLengthyArray( filterQuery.year ) ||
		isLengthyArray( filterQuery.monthnum ) ||
		isLengthyArray( filterQuery.day )
	) {
		const { startDate, endDate } = generateDateRange(
			filterQuery.year,
			filterQuery.monthnum,
			filterQuery.day
		);
		filter.bool.must.push( { range: { date: { gte: startDate, lt: endDate } } } );
	}
	return filter;
}

export function search( { aggregations, filter, query, resultFormat, siteId, sort } ) {
	let fields = [];
	let highlight_fields = [];
	switch ( resultFormat ) {
		case 'engagement':
		case 'product':
		case 'minimal':
		default:
			highlight_fields = [ 'title', 'content', 'comments' ];
			fields = [
				'date',
				'permalink.url.raw',
				'tag.name.default',
				'category.name.default',
				'post_type',
				'has.image',
				'shortcode_types',
			];
	}

	const queryString = encode(
		flatten( {
			aggregations,
			fields,
			highlight_fields,
			filter: buildFilterObject( filter ),
			query: encodeURIComponent( query ),
			sort,
		} )
	);

	return fetch(
		`https://public-api.wordpress.com/rest/v1.3/sites/${ siteId }/search?${ queryString }`
	).then( response => response.json() );
}
