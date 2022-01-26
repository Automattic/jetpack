/**
 * Internal dependencies
 */
import { SERVER_OBJECT_NAME } from './constants';

// NOTE: This list is missing custom taxonomy names.
//       getFilterKeys must be used to get the conclusive list of valid filter keys.
export const FILTER_KEYS = Object.freeze( [
	// Post types
	'post_types',
	// Built-in taxonomies
	'category',
	'post_format',
	'post_tag',
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

/**
 * Returns an array of valid filter key strings.
 *
 * @param {object[]} widgets - Array of Jetpack Search widget objects inside the overlay sidebar.
 * @param {object[]} widgetsOutsideOverlay - Array of Jetpack Search widget objects outside the overlay sidebar.
 * @returns {string[]} filterKeys
 */
export function getFilterKeys(
	widgets = window[ SERVER_OBJECT_NAME ]?.widgets,
	widgetsOutsideOverlay = window[ SERVER_OBJECT_NAME ]?.widgetsOutsideOverlay
) {
	// Extract taxonomy names from server widget data
	const keys = new Set( FILTER_KEYS );
	[ ...( widgets ?? [] ), ...( widgetsOutsideOverlay ?? [] ) ]
		.map( w => w.filters )
		.filter( filters => Array.isArray( filters ) )
		.reduce( ( filtersA, filtersB ) => filtersA.concat( filtersB ), [] )
		.filter( filter => filter.type === 'taxonomy' )
		.forEach( filter => keys.add( filter.taxonomy ) );

	return [ ...keys ];
}

/**
 * Get a list of provided static filters.
 *
 * @returns {Array} list of available static filters.
 */
export function getAvailableStaticFilters() {
	if ( ! window[ SERVER_OBJECT_NAME ]?.staticFilters ) {
		return [];
	}

	return window[ SERVER_OBJECT_NAME ].staticFilters;
}

/**
 * Get static filter keys.
 *
 * @returns {Array} list of available static filters keys.
 */
export function getStaticFilterKeys() {
	const staticFilters = getAvailableStaticFilters();
	const keys = new Set();
	staticFilters.forEach( filter => keys.add( filter.filter_id ) );

	return [ ...keys ];
}

/**
 * Returns an array of filter keys selectable from within the overlay.
 *
 * @param {object[]} widgets - Array of Jetpack Search widget objects inside the overlay sidebar.
 * @returns {string[]} filterKeys
 */
export function getSelectableFilterKeys( widgets = window[ SERVER_OBJECT_NAME ]?.widgets ) {
	return (
		widgets?.map( extractFilterKeys ).reduce( ( prev, current ) => prev.concat( current ), [] ) ??
		[]
	);
}

/**
 * Returns an array of filter keys not selectable from within the overlay.
 * In other words, they were either selected via filters outside the search sidebar or entered manually.
 *
 * @param {object[]} widgets - Array of Jetpack Search widget objects inside the overlay sidebar.
 * @returns {string[]} filterKeys
 */
export function getUnselectableFilterKeys( widgets = window[ SERVER_OBJECT_NAME ]?.widgets ) {
	const selectable = getSelectableFilterKeys( widgets );
	return getFilterKeys().filter( key => ! selectable.includes( key ) );
}

/**
 * Returns an array of filter keys from a given widget.
 *
 * @param {object} widget - a Jetpack Search widget object
 * @returns {string[]} filterKeys
 */
function extractFilterKeys( widget ) {
	return widget.filters
		.map( mapFilterToFilterKey )
		.filter( filterName => typeof filterName === 'string' );
}

/**
 * Returns a filter key given a filter object.
 *
 * @param {object} filter - a Jetpack Search filter object
 * @returns {string} filterKeys
 */
export function mapFilterToFilterKey( filter ) {
	if ( filter.type === 'date_histogram' ) {
		return `${ filter.interval }_${ filter.field }`;
	} else if ( filter.type === 'taxonomy' ) {
		return `${ filter.taxonomy }`;
	} else if ( filter.type === 'post_type' ) {
		return 'post_types';
	} else if ( filter.type === 'group' ) {
		return filter.filter_id;
	}
	return null;
}

/**
 * Returns a filter object corresponding to the filterKey input.
 * Inverse of `mapFilterToFilterKey`.
 *
 * @param {string} filterKey - filter key string to be mapped.
 * @returns {object} filterObject
 */
export function mapFilterKeyToFilter( filterKey ) {
	if ( filterKey.includes( 'month' ) ) {
		return {
			field: filterKey.split( 'month_' ).pop(),
			type: 'date_histogram',
			interval: 'month',
		};
	} else if ( filterKey.includes( 'year' ) ) {
		return {
			field: filterKey.split( 'year_' ).pop(),
			type: 'date_histogram',
			interval: 'year',
		};
	} else if ( filterKey === 'post_types' ) {
		return {
			type: 'post_type',
		};
	} else if ( filterKey === 'group' ) {
		return {
			type: 'group',
		};
	}

	return {
		type: 'taxonomy',
		taxonomy: filterKey,
	};
}

/**
 * Returns the type of the inputted filter object.
 *
 * @param {object} filter - filter key string to be mapped.
 * @returns {string} output
 */
export function mapFilterToType( filter ) {
	if ( filter.type === 'date_histogram' ) {
		return 'date';
	} else if ( filter.type === 'taxonomy' ) {
		return 'taxonomy';
	} else if ( filter.type === 'post_type' ) {
		return 'postType';
	} else if ( filter.type === 'group' ) {
		return 'group';
	}
}
