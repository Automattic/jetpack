// NOTE: We only import the difference package here for to reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import difference from 'lodash/difference';

/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from './constants';

const FILTER_KEYS = Object.freeze( [
	// Post types
	'post_types',
	// Date filters
	'month_post_date',
	'month_post_date_gmt',
	'month_post_modified',
	'month_post_modified_gmt',
	'year_post_date',
	'year_post_date_gmt',
	'year_post_modified',
	'year_post_modified_gmt',
] );

export function getFilterKeys() {
	// Extract taxonomy names from server widget data
	const taxonomies = window[ SERVER_OBJECT_NAME ].widgets
		.map( w => w.filters )
		.filter( filters => Array.isArray( filters ) )
		.reduce( ( filtersA, filtersB ) => filtersA.concat( filtersB ), [] )
		.filter( filter => filter.type === 'taxonomy' )
		.map( filter => filter.taxonomy );
	return [ ...FILTER_KEYS, ...taxonomies ];
}

// These filter keys are selectable from sidebar filters
function getSelectableFilterKeys( overlayWidgets ) {
	return overlayWidgets
		.map( extractFilters )
		.reduce( ( prev, current ) => prev.concat( current ), [] );
}

// These filter keys are not selectable from sidebar filters
// In other words, they were selected via filters outside the search sidebar
export function getUnselectableFilterKeys( overlayWidgets ) {
	return difference( getFilterKeys(), getSelectableFilterKeys( overlayWidgets ) );
}

function extractFilters( widget ) {
	return widget.filters
		.map( mapFilterToFilterKey )
		.filter( filterName => typeof filterName === 'string' );
}

export function mapFilterToFilterKey( filter ) {
	if ( filter.type === 'date_histogram' ) {
		return `${ filter.interval }_${ filter.field }`;
	} else if ( filter.type === 'taxonomy' ) {
		return `${ filter.taxonomy }`;
	} else if ( filter.type === 'post_type' ) {
		return 'post_types';
	}
	return null;
}

export function mapFilterToType( filter ) {
	if ( filter.type === 'date_histogram' ) {
		return 'date';
	} else if ( filter.type === 'taxonomy' ) {
		return 'taxonomy';
	} else if ( filter.type === 'post_type' ) {
		return 'postType';
	}
}
