/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const MULTISITE_NO_GROUP_VALUE = '__NO_GROUP__';

export const SERVER_OBJECT_NAME = 'JetpackInstantSearchOptions';
export const OVERLAY_CLASS_NAME = 'jetpack-instant-search__overlay';
export const SORT_DIRECTION_ASC = 'ASC';
export const SORT_DIRECTION_DESC = 'DESC';
export const RESULT_FORMAT_EXPANDED = 'expanded';
export const RESULT_FORMAT_MINIMAL = 'minimal';
export const RESULT_FORMAT_PRODUCT = 'product';
export const MINUTE_IN_MILLISECONDS = 60 * 1000;
export const RELEVANCE_SORT_KEY = 'relevance';
export const DEBOUNCED_TIME_TO_SET_QUERY_MILLISECONDS = 1000;
// @todo extract this to a function that uses SORT_OPTIONS and PRODUCT_SORT_OPTIONS to avoid duplication
export const VALID_SORT_KEYS = [
	'newest',
	'oldest',
	RELEVANCE_SORT_KEY,
	'price_asc',
	'price_desc',
	'rating_desc',
];
export const VALID_RESULT_FORMAT_KEYS = [
	RESULT_FORMAT_EXPANDED,
	RESULT_FORMAT_MINIMAL,
	RESULT_FORMAT_PRODUCT,
];
export const SORT_OPTIONS = new Map( [
	[ RELEVANCE_SORT_KEY, __( 'Relevance', 'jetpack-search-pkg' ) ],
	[ 'newest', __( 'Newest', 'jetpack-search-pkg' ) ],
	[ 'oldest', __( 'Oldest', 'jetpack-search-pkg' ) ],
] );
export const PRODUCT_SORT_OPTIONS = new Map( [
	[ 'price_asc', __( 'Price: low to high', 'jetpack-search-pkg' ) ],
	[ 'price_desc', __( 'Price: high to low', 'jetpack-search-pkg' ) ],
	[ 'rating_desc', __( 'Rating', 'jetpack-search-pkg' ) ],
] );
