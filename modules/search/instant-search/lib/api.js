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
function generateDateRange( query, type ) {
	// NOTE: This only supports a single date query at this time
	const input = Array.isArray( query ) && query[ 0 ];

	let year, month;
	if ( type === 'year' ) {
		[ , year, , ] = input.match( DATE_REGEX );
	}

	if ( type === 'month' ) {
		[ , year, month ] = input.match( DATE_REGEX );
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
	if ( isLengthyArray( filterQuery.month_post_date ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.month_post_date, 'month' );
		filter.bool.must.push( { range: { date: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.month_post_date_gmt ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.month_post_date_gmt, 'month' );
		filter.bool.must.push( { range: { date_gmt: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.month_post_modified ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.month_post_modified, 'month' );
		filter.bool.must.push( { range: { modified: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.month_post_modified_gmt ) ) {
		const { startDate, endDate } = generateDateRange(
			filterQuery.month_post_modified_gmt,
			'month'
		);
		filter.bool.must.push( { range: { modified_gmt: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.year_post_date ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.year_post_date, 'year' );
		filter.bool.must.push( { range: { date: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.year_post_date_gmt ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.year_post_date_gmt, 'year' );
		filter.bool.must.push( { range: { date_gmt: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.year_post_modified ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.year_post_modified, 'year' );
		filter.bool.must.push( { range: { modified: { gte: startDate, lt: endDate } } } );
	}
	if ( isLengthyArray( filterQuery.year_post_modified_gmt ) ) {
		const { startDate, endDate } = generateDateRange( filterQuery.year_post_modified_gmt, 'year' );
		filter.bool.must.push( { range: { modified_gmt: { gte: startDate, lt: endDate } } } );
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
				'modified',
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
